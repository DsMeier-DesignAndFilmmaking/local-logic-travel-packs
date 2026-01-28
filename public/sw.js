/**
 * Service Worker: Tactical Vault Engine v2.2
 * Hardened for Next.js Hydration & Offline Sandboxing
 */

const CACHE_VERSION = 'v2.2';
const CACHE_PREFIX = 'city-pack-';
const GLOBAL_CACHE = `tactical-vault-core-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tactical-vault-dynamic-api-${CACHE_VERSION}`;

// --- 1. HELPERS (Must be at the top to avoid ReferenceErrors) ---

/**
 * Extracts city slug from /packs/city-name
 */
function getCityFromPath(pathname) {
  const match = pathname.match(/^\/packs\/([^\/?#]+)/);
  return match ? match[1] : null;
}

/**
 * Generates the specific cache name for a city sandbox
 */
function getCityCacheName(citySlug) {
  return `${CACHE_PREFIX}${citySlug}-${CACHE_VERSION}`;
}

/**
 * Determines if an asset should be stored in the permanent vault
 */
function shouldCache(url) {
  const pathname = new URL(url).pathname;
  return (
    pathname.startsWith('/_next/static/') || 
    pathname.endsWith('.js') || 
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.includes('manifest') ||
    pathname.startsWith('/icons/')
  );
}

// --- 2. LIFECYCLE EVENTS ---

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(GLOBAL_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/travel-pack-icon-192.png',
        '/travel-pack-icon-512.png'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(key => {
        if (!key.includes(CACHE_VERSION)) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// --- 3. FETCH STRATEGY (The "Safety Net") ---

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET and cross-origin (e.g. analytics, external fonts)
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      try {
        // A. Check Cache (Use ignoreSearch for A2HS support)
        const cachedResponse = await caches.match(request, { ignoreSearch: true });
        if (cachedResponse) return cachedResponse;

        // B. Network Try
        const networkResponse = await fetch(request);

        // C. On-the-fly Caching
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          const citySlug = getCityFromPath(url.pathname);
          
          // Route to City Sandbox or Global Cache
          const cacheName = citySlug ? getCityCacheName(citySlug) : 
                           url.pathname.startsWith('/api/') ? DYNAMIC_CACHE : GLOBAL_CACHE;
          
          const cache = await caches.open(cacheName);
          cache.put(request, clone);
          
          return networkResponse;
        }

        return networkResponse;
      } catch (error) {
        console.warn(`[Vault] Fetch failure for ${url.pathname}:`, error);

        // D. OFFLINE FALLBACKS
        // If it's a page navigation, try to return the root shell or the cached HTML
        if (request.destination === 'document') {
          const fallback = await caches.match(request, { ignoreSearch: true });
          if (fallback) return fallback;
          
          const rootShell = await caches.match('/');
          if (rootShell) return rootShell;
        }

        // E. PREVENT WHITE SCREEN: Always return a Response, never undefined
        return new Response('Offline content unavailable', { 
          status: 503, 
          statusText: 'Service Unavailable (Offline)' 
        });
      }
    })()
  );
});

// --- 4. TACTICAL SYNC ENGINE ---

self.addEventListener('message', async (event) => {
  // Use event.waitUntil so the browser doesn't kill the SW during the sync
  if (event.data && event.data.type === 'START_OFFLINE_SYNC') {
    const { citySlug, assets } = event.data.payload;
    
    event.waitUntil((async () => {
      const cacheName = getCityCacheName(citySlug);
      const cache = await caches.open(cacheName);
      
      let completed = 0;
      const total = assets.length;

      console.log(`📡 SW: Starting sync for ${citySlug}. Assets: ${total}`);

      // Process all assets
      await Promise.all(assets.map(async (url) => {
        try {
          // Use { cache: 'reload' } to ensure we aren't getting a stale local version
          const response = await fetch(url, { cache: 'reload' });
          
          if (response.ok) {
            await cache.put(url, response);
            console.log(`📥 SW Secured: ${url}`);
          } else {
            console.warn(`⚠️ SW Asset returned status ${response.status}: ${url}`);
          }
        } catch (err) {
          console.error(`❌ SW Network Failure for: ${url}`, err);
        } finally {
          completed++;
          
          // Calculate progress from 15% (start) to 100% (finish)
          const progress = Math.round(15 + ((completed / total) * 85));
          
          // Broadcast to all open tabs/clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_PROGRESS',
              payload: { 
                citySlug: citySlug, 
                progress: progress 
              }
            });
          });
        }
      }));
      
      console.log(`✅ SW: Sync Complete for ${citySlug}`);
    })());
  }
});