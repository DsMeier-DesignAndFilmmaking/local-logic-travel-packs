/**
 * Service Worker - Tactical Vault Offline Engine
 * Strategy: Manifest-Driven Aggressive Caching
 */

const CACHE_VERSION = 'v2.2';
const CACHE_PREFIX = 'city-pack-';
const GLOBAL_CACHE = `tactical-vault-core-${CACHE_VERSION}`;

// 1. Helper for City-Specific Caching
const getCityCacheName = (slug) => `${CACHE_PREFIX}${slug}-${CACHE_VERSION}`;

// 2. INSTALL: Pre-cache App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(GLOBAL_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/travel-pack-icon-192.png',
        '/travel-pack-icon-512.png',
        '/apple-touch-icon.png'
      ]);
    })
  );
});

// 3. ACTIVATE: Cleanup and Claim
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(key => {
        if (!key.includes(CACHE_VERSION)) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// 4. FETCH: Standard Cache-First with ignoreSearch for Tactical Vault
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests to our own origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // STRATEGY: Network-First for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // STRATEGY: Cache-First for everything else (HTML, JS, CSS, Images)
  event.respondWith(
    // ignoreSearch: true is vital for matching the A2HS '?source=a2hs' suffix
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request).then((networkRes) => {
        // Cache static assets on the fly as the user browses
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          const city = getCityFromPath(url.pathname);
          const cacheName = city ? getCityCacheName(city) : GLOBAL_CACHE;
          
          caches.open(cacheName).then((cache) => {
            cache.put(request, clone);
          });
        }
        return networkRes;
      }).catch(() => {
        // Fallback for document navigation: return the root shell if offline
        if (request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

// 5. THE SYNC ENGINE: Listen for START_OFFLINE_SYNC
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  if (type === 'START_OFFLINE_SYNC') {
    const { citySlug, assets } = payload;
    const cacheName = getCityCacheName(citySlug);
    const cache = await caches.open(cacheName);
    
    let completed = 0;
    const total = assets.length;

    // Report initial engagement
    await broadcastProgress(citySlug, 15);

    // Process assets in parallel-ish chunks for speed
    await Promise.all(assets.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' }); // Force fresh fetch
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        console.error(`Tactical Vault: Failed to secure ${url}`, err);
      } finally {
        completed++;
        // Scale progress from 15% to 100%
        const progress = Math.round(15 + ((completed / total) * 85));
        await broadcastProgress(citySlug, progress);
      }
    }));
  }
});

// Helper to update the UI
async function broadcastProgress(citySlug, progress) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_PROGRESS',
      payload: { citySlug, progress }
    });
  });
}