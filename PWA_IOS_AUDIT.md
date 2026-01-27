# PWA iOS "Add to Home Screen" Audit Report

## Current Setup Analysis

### 1. Manifest Configuration (`public/manifest.json`)

**Current Values:**
- `id`: `"/"` - App-wide identifier
- `start_url`: `"/?source=pwa"` - **Root route, loads entire app**
- `scope`: Not explicitly set (defaults to `"/"` - entire app)
- `name`: "Tactical Vault"
- `short_name`: "Vault"

**Issues:**
- ❌ `start_url` points to root (`/`), which loads the full app with all cities
- ❌ No `scope` restriction - defaults to entire app
- ❌ Static manifest - same for all cities
- ❌ No city-specific identification

### 2. Service Worker Registration (`src/components/SWRegister.tsx`)

**Current Configuration:**
```typescript
const reg = await navigator.serviceWorker.register('/sw.js', {
  scope: '/',  // ❌ Entire app scope
});
```

**Issues:**
- ❌ Service worker scope is `'/'` - controls entire app
- ❌ No city-specific scope configuration
- ❌ Same service worker for all installations

### 3. Service Worker Caching (`public/sw.js`)

**Current Caching Rules:**

1. **Start URL / Home Route:**
   ```javascript
   workbox.routing.registerRoute(
     ({ url }) => url.pathname === '/' || url.pathname === '/index',
     new workbox.strategies.NetworkFirst({
       cacheName: 'start-url',
     })
   );
   ```
   - ❌ Caches root `/` - entire app shell

2. **City Pack Routes:**
   ```javascript
   workbox.routing.registerRoute(
     ({ url }) => url.pathname.startsWith('/packs/'),
     cityKillSwitchHandler
   );
   ```
   - ⚠️ Routes `/packs/` but app uses query params (`/?city=paris`), not `/packs/paris`
   - ❌ Doesn't restrict to specific city

3. **Static Assets:**
   ```javascript
   workbox.routing.registerRoute(
     ({ request }) => 
       request.destination === 'style' || 
       request.destination === 'script' || 
       request.destination === 'image',
     new workbox.strategies.StaleWhileRevalidate({
       cacheName: 'static-resources',
     })
   );
   ```
   - ❌ Caches all static assets globally

### 4. Next.js PWA Configuration (`next.config.js`)

**Current Configuration:**
```javascript
runtimeCaching: [
  {
    urlPattern: ({ request }) => request.mode === 'navigate',
    handler: 'StaleWhileRevalidate',
    cacheName: 'pages-cache',
    expiration: { 
      maxEntries: 20,  // ❌ Can cache up to 20 different pages/cities
      maxAgeSeconds: 30 * 24 * 60 * 60
    },
  },
  {
    urlPattern: /\/api\/travel-packs\/?(\?.*)?$/,
    handler: "NetworkFirst",
    cacheName: "travel-packs-api",
    expiration: { 
      maxEntries: 32,  // ❌ Can cache up to 32 different city packs
    },
  },
]
```

**Issues:**
- ❌ `pages-cache` allows 20 entries - can cache multiple cities
- ❌ `travel-packs-api` allows 32 entries - can cache all cities
- ❌ No city-specific cache naming
- ❌ No restriction to single city

### 5. App Routing Structure

**Current URL Patterns:**
- Home: `/` or `/?source=pwa`
- City Pack: `/?city=paris` (query parameter, not route)
- API: `/api/pack?city=paris`
- API: `/api/travel-packs?city=paris`

**Issues:**
- ⚠️ No dedicated route structure like `/packs/paris` 
- ⚠️ City selection via query params only
- ⚠️ Makes it harder to create city-specific manifests

## Summary of Problems

### Critical Issues:
1. **Manifest is static** - Same manifest for all cities
2. **start_url is root** - Loads entire app, not city-specific pack
3. **Service worker scope is app-wide** - Controls entire app, not city-specific
4. **Caching allows multiple cities** - No restriction to single city
5. **No city-specific identification** - Can't distinguish between city installations

### Impact:
When a user adds to home screen on iOS:
- ✅ The app installs correctly
- ❌ But it installs the **entire app** with access to all cities
- ❌ Not just the current city's travel pack
- ❌ Multiple installations would share the same manifest/scope

## Required Changes

### Phase 1: Dynamic Manifest Generation
- Generate city-specific manifest on-demand
- Set `start_url` to `/?city={cityName}&source=pwa`
- Set `scope` to `/?city={cityName}` or use query param matching
- Set `id` to city-specific value
- Update `name`/`short_name` to include city name

### Phase 2: City-Specific Service Worker Scope
- Option A: Generate city-specific service worker files
- Option B: Use service worker with city-aware caching
- Restrict cache to single city's data only

### Phase 3: Cache Restriction
- Limit `pages-cache` to 1 entry (current city only)
- Limit `travel-packs-api` to 1 entry (current city only)
- Use city-specific cache names (e.g., `pages-cache-paris`)

### Phase 4: Installation Flow
- Detect when user wants to "Add to Home Screen"
- Capture current city context
- Generate/update manifest with city-specific values
- Trigger service worker update with city-specific scope

## Next Steps

1. ✅ **Audit Complete** - This document
2. ⏭️ **Design city-specific manifest generation**
3. ⏭️ **Implement dynamic manifest route**
4. ⏭️ **Update service worker for city-specific caching**
5. ⏭️ **Add installation detection and city capture**
6. ⏭️ **Test iOS "Add to Home Screen" with city-specific manifest**
