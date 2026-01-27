/**
 * Service Worker - Tactical Vault Offline Engine
 */

const CACHE_VERSION = 'v2'; // Bumped version to clear old white-screen caches
const CACHE_PREFIX = 'city-pack-';
const GLOBAL_CACHE = 'tactical-vault-core-v2';

// 1. Identify City
function getCityFromPath(pathname) {
  const match = pathname.match(/^\/packs\/([^\/]+)/);
  return match ? match[1] : null;
}

function getCityCacheName(city) {
  return `${CACHE_PREFIX}${city}-${CACHE_VERSION}`;
}

// 2. Updated Cache Logic
function shouldCache(url) {
  const pathname = new URL(url).pathname;
  
  if (pathname === '/' || pathname === '') return false;

  // CORE ENGINE ASSETS (Crucial to prevent white screen)
  if (
    pathname.startsWith('/_next/static/') || 
    pathname.endsWith('.js') || 
    pathname.endsWith('.css') ||
    pathname.includes('manifest')
  ) {
    return true;
  }
  
  // CITY CONTENT
  if (
    pathname.match(/^\/packs\/[^\/]+$/) ||
    pathname.startsWith('/api/pack') || 
    pathname.startsWith('/api/travel-packs') ||
    pathname.startsWith('/icons/')
  ) {
    return true;
  }
  
  return false;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(CACHE_PREFIX) && !cacheName.includes(CACHE_VERSION)) {
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

  // Determine if this is a global asset (JS/CSS) or a city-specific asset
  const isGlobalAsset = url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.css');
  const city = getCityFromPath(url.pathname) || url.searchParams.get('city');
  
  // Choose cache: Use a global cache for Next.js engine files, city cache for the rest
  const cacheName = isGlobalAsset ? GLOBAL_CACHE : (city ? getCityCacheName(city) : GLOBAL_CACHE);

  event.respondWith(
    caches.open(cacheName).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        
        // Cache-First Strategy
        if (cachedResponse) {
          // Background sync to keep it fresh
          if (navigator.onLine) {
            fetch(request).then((res) => {
              if (res.status === 200) cache.put(request, res.clone());
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // Network Fallback
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If HTML page fails offline, return a friendly string if not cached
          if (request.destination === 'document') {
            return new Response("City Pack not yet downloaded for offline use.", {
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        });
      });
    })
  );
});

// Proactive caching for "Add to Home Screen"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URL') {
    const url = event.data.payload;
    const city = getCityFromPath(new URL(url).pathname);
    const cacheName = city ? getCityCacheName(city) : GLOBAL_CACHE;

    caches.open(cacheName).then((cache) => cache.add(url));
  }
});