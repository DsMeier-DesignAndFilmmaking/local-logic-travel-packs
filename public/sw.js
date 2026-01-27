/**
 * Service Worker - Cache-First Strategy for City-Specific PWA
 * 
 * This service worker implements a Cache-First strategy specifically for
 * city pack pages to enable 100% offline functionality.
 * 
 * Key Features:
 * - Cache-First: Always serves from cache when available
 * - City-Specific: Only caches routes and assets for the current city
 * - Excludes homepage and navigation elements
 * - Handles Next.js static assets for city routes
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'city-pack-';

// Extract city from URL pathname
function getCityFromPath(pathname) {
  const match = pathname.match(/^\/packs\/([^\/]+)/);
  return match ? match[1] : null;
}

// Get city-specific cache name
function getCityCacheName(city) {
  return `${CACHE_PREFIX}${city}-${CACHE_VERSION}`;
}

// Check if URL should be cached (city-specific routes only)
function shouldCache(url) {
  const pathname = new URL(url).pathname;
  
  // Never cache homepage
  if (pathname === '/' || pathname === '') {
    return false;
  }
  
  // Cache city pack pages: /packs/[city]
  if (pathname.match(/^\/packs\/[^\/]+$/)) {
    return true;
  }
  
  // Cache city-specific manifest API: /api/manifest/[city]
  if (pathname.match(/^\/api\/manifest\/[^\/]+$/)) {
    return true;
  }
  
  // Cache city-specific pack API: /api/pack?city=[city] or /api/travel-packs?city=[city]
  if (pathname.startsWith('/api/pack') || pathname.startsWith('/api/travel-packs')) {
    const urlObj = new URL(url);
    const cityParam = urlObj.searchParams.get('city');
    if (cityParam) {
      return true;
    }
  }
  
  // Cache city-specific icons: /icons/[city]-*.png
  if (pathname.match(/^\/icons\/[^\/]+-\d+\.png$/)) {
    return true;
  }
  
  // Cache Next.js static assets (_next/static) for city routes
  // These are needed for the city page to function offline
  if (pathname.startsWith('/_next/static/')) {
    return true;
  }
  
  // Cache fallback icons (travel-pack-icon-*.png)
  if (pathname.match(/^\/travel-pack-icon-\d+\.png$/)) {
    return true;
  }
  
  // Don't cache anything else (homepage, other cities, etc.)
  return false;
}

// Install event - precache city-specific assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheName.startsWith(CACHE_PREFIX) && !cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Cache-First strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Check if this URL should be cached
  if (!shouldCache(url.href)) {
    // Let browser handle non-cacheable requests (homepage, etc.)
    return;
  }
  
  // Extract city from current page context or request URL
  const city = getCityFromPath(url.pathname) || 
               (url.searchParams.get('city') ? 
                 url.searchParams.get('city').toLowerCase().replace(/\s+/g, '-') : 
                 null);
  
  if (!city) {
    // Can't determine city, let browser handle
    return;
  }
  
  const cacheName = getCityCacheName(city);
  
  event.respondWith(
    caches.open(cacheName).then((cache) => {
      // Cache-First: Check cache first
      return cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Cache hit:', url.pathname);
          
          // Update cache in background if online
          if (navigator.onLine) {
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(request, networkResponse.clone());
                  console.log('[SW] Cache updated in background:', url.pathname);
                }
              })
              .catch((err) => {
                console.log('[SW] Background update failed:', err);
              });
          }
          
          return cachedResponse;
        }
        
        // Cache miss: Fetch from network
        console.log('[SW] Cache miss, fetching:', url.pathname);
        
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              // Clone response before caching (responses can only be read once)
              cache.put(request, networkResponse.clone());
              console.log('[SW] Cached new resource:', url.pathname);
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Return offline fallback if available
            if (request.destination === 'document') {
              // For HTML pages, we could return a cached offline page
              // For now, let the browser handle the error
              return new Response('Offline - Content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            
            throw error;
          });
      });
    })
  );
});

// Handle messages from the client (for manual cache operations)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URL') {
    const url = event.data.payload;
    const city = getCityFromPath(url);
    
    if (city) {
      const cacheName = getCityCacheName(city);
      
      caches.open(cacheName).then((cache) => {
        return fetch(url).then((response) => {
          if (response && response.status === 200) {
            cache.put(url, response);
            console.log('[SW] Manually cached:', url);
          }
        });
      }).catch((err) => {
        console.error('[SW] Manual cache failed:', err);
      });
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker script loaded');
