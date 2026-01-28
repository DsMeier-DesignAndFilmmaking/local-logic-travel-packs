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

// 4. FETCH: Standard Cache-First with API Network-First fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Tactical API Handling (Network First)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(GLOBAL_CACHE).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // General Assets (Cache First)
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(networkRes => {
        // Logically determine if we should cache this on the fly
        if (networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(GLOBAL_CACHE).then(cache => cache.put(request, clone));
        }
        return networkRes;
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