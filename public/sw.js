/**
 * Service Worker - Tactical Vault Offline Engine
 * Strategy: Aggressive Pre-emptive Caching
 */

const CACHE_VERSION = 'v2.1'; 
const CACHE_PREFIX = 'city-pack-';
const GLOBAL_CACHE = `tactical-vault-core-${CACHE_VERSION}`;

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
  if (pathname === '/' || pathname === '') return false;

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

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old versions
          if (cacheName.includes('city-pack-') && !cacheName.includes(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (!shouldCache(url.href)) return;

  const isGlobalAsset = url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.css');
  const city = getCityFromPath(url.pathname) || url.searchParams.get('city');
  const cacheName = isGlobalAsset ? GLOBAL_CACHE : (city ? getCityCacheName(city) : GLOBAL_CACHE);

  event.respondWith(
    caches.open(cacheName).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Cache-First with Network Refresh
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) cache.put(request, networkResponse.clone());
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      });
    })
  );
});

/**
 * AGGRESSIVE PRE-EMPTIVE SYNC
 * This triggers when the frontend sends the "CACHE_URL" message.
 * It doesn't just cache the URL; it fetches the API data too.
 */
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_URL') {
    const urlStr = event.data.payload;
    const url = new URL(urlStr);
    const city = getCityFromPath(url.pathname);
    
    if (!city) return;

    const cacheName = getCityCacheName(city);
    const apiEndpoint = `/api/pack?city=${city}`;

    console.log(`📡 Vault Scraper: Locking in offline assets for ${city}...`);

    const cache = await caches.open(cacheName);
    
    // Add the HTML page and the API data simultaneously
    // This ensures that even if they never open the "App", the data is ready.
    try {
      await Promise.all([
        cache.add(urlStr),
        cache.add(apiEndpoint)
      ]);
      console.log(`✅ Vault Verified: ${city} is ready for offline use.`);
    } catch (err) {
      console.error('❌ Vault Sync Failed:', err);
    }
  }
});