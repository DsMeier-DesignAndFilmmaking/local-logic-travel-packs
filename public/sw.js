/**
 * Service Worker - Tactical Vault Offline Engine
 * Strategy: Aggressive Pre-emptive Caching + Core Shell Persistence
 */

const CACHE_VERSION = 'v2.2'; // Incremented for new logic
const CACHE_PREFIX = 'city-pack-';
const GLOBAL_CACHE = `tactical-vault-core-${CACHE_VERSION}`;

/**
 * CORE ASSETS - The "App Shell"
 * These must be present for the app to launch in Airplane Mode.
 * Ensure these paths match your /public folder exactly.
 */
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/travel-pack-icon-192.png',
  '/travel-pack-icon-512.png',
  '/apple-touch-icon.png?v=2' 
];

// 1. Identify City Helper
function getCityFromPath(pathname) {
  const match = pathname.match(/^\/packs\/([^\/]+)/);
  return match ? match[1] : null;
}

function getCityCacheName(city) {
  return `${CACHE_PREFIX}${city}-${CACHE_VERSION}`;
}

// 2. Identify if URL should be cached
function shouldCache(url) {
  const pathname = new URL(url).pathname;
  
  // Always cache the root and core assets
  if (pathname === '/' || CORE_ASSETS.includes(pathname)) return true;

  return (
    pathname.startsWith('/_next/static/') || 
    pathname.endsWith('.js') || 
    pathname.endsWith('.css') ||
    pathname.includes('manifest') ||
    pathname.match(/^\/packs\/[^\/]+$/) ||
    pathname.startsWith('/api/pack') || 
    pathname.startsWith('/api/travel-packs') ||
    pathname.startsWith('/icons/')
  );
}

// 3. INSTALL: Pre-cache the "Home" and "Manifest" (Prevents Offline Alert)
self.addEventListener('install', (event) => {
  console.log('🏗️ SW Install: Pre-caching Core Engine');
  event.waitUntil(
    caches.open(GLOBAL_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 4. ACTIVATE: Cleanup old caches and take control
self.addEventListener('activate', (event) => {
  console.log('🚀 SW Activate: Taking Control & Cleaning Caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          const isOldCityPack = cacheName.startsWith(CACHE_PREFIX) && !cacheName.includes(CACHE_VERSION);
          const isOldCore = cacheName.startsWith('tactical-vault-core-') && cacheName !== GLOBAL_CACHE;
          
          if (isOldCityPack || isOldCore) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 5. FETCH: Cache-First Strategy

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return from cache immediately if found (Prevents network-related alerts)
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        if (shouldCache(url.href)) {
          const responseToCache = networkResponse.clone();
          const city = getCityFromPath(url.pathname) || url.searchParams.get('city');
          const cacheName = city ? getCityCacheName(city) : GLOBAL_CACHE;
          
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // FAILSAFE: Return root if offline and nothing else matches
        if (request.destination === 'document') {
           return caches.match('/'); 
        }
      });
    })
  );
});

/**
 * 6. MESSAGE: AGGRESSIVE PRE-EMPTIVE SYNC
 * Correctly handles both City Packs and the Root App Shell.
 */
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_URL') {
    const { payload: urlStr } = event.data;
    const url = new URL(urlStr, location.origin);
    const city = getCityFromPath(url.pathname);
    
    // Determine which cache to use and what to download
    const isRoot = url.pathname === '/';
    const cacheName = city ? getCityCacheName(city) : GLOBAL_CACHE;
    const assetsToCache = city ? [urlStr, `/api/pack?city=${city}`] : [urlStr];

    console.log(`📡 Vault Sync: Target [${city || 'ROOT'}] -> Cache [${cacheName}]`);

    const cache = await caches.open(cacheName);
    let completed = 0;

    for (const asset of assetsToCache) {
      try {
        await cache.add(asset);
        completed++;
        const progress = Math.round((completed / assetsToCache.length) * 100);
        
        // Report progress back to the UI
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_PROGRESS',
            payload: { 
              city: city || 'root', // Identify as root if no city
              progress 
            }
          });
        });
      } catch (err) {
        console.error(`❌ Vault Sync Error for ${asset}:`, err);
        // Still send a fail message or update progress so the UI doesn't hang
      }
    }
  }
});