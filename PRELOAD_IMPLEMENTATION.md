# Travel Pack Preloading Implementation

## Overview

All Tier 1 JSON city packs are now automatically preloaded for offline access when users first visit the application. This ensures that travel packs are available immediately, even when the device is offline.

## How It Works

### 1. **API Endpoint for City List**
- **Route**: `/api/cities/list`
- **Purpose**: Returns all cities that have available travel packs
- **Caching**: Cached by service worker for 1 day

### 2. **Preload Function** (`src/lib/preloadPacks.ts`)
- **`preloadAllPacks()`**: Fetches all available city packs via API
- **`preloadAllPacksBackground()`**: Runs preloading in background using `requestIdleCallback`
- **Batch Processing**: Fetches packs in batches of 3 to avoid overwhelming the network
- **Service Worker Integration**: All API responses are automatically cached by the service worker

### 3. **Automatic Execution**
- Preloading starts automatically when the main page loads
- Uses `requestIdleCallback` to run during browser idle time (non-blocking)
- Falls back to `setTimeout` for browsers without `requestIdleCallback`

## Service Worker Caching

The service worker is configured to cache:
- **Travel Packs API** (`/api/travel-packs`): NetworkFirst strategy, 7-day expiration
- **Cities List API** (`/api/cities/list`): NetworkFirst strategy, 1-day expiration

### Caching Strategy: NetworkFirst
1. Try to fetch from network first
2. If network fails (offline), serve from cache
3. Cache is updated on successful network requests

## Implementation Details

### Files Created/Modified

1. **`src/app/api/cities/list/route.ts`**
   - New API endpoint to list all available cities

2. **`src/lib/preloadPacks.ts`**
   - Preload utility functions
   - Background preloading with browser optimization

3. **`src/app/page.tsx`**
   - Added preload call on initial page load

4. **`next.config.ts`**
   - Added caching rule for `/api/cities/list` endpoint

## Testing

### In Production Mode

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open browser DevTools → Network tab
4. Load the page and observe:
   - Multiple requests to `/api/travel-packs?city=...`
   - All requests should succeed (200 status)
5. Check Service Worker cache:
   - DevTools → Application → Cache Storage
   - Look for `travelPacksCache` and `citiesListCache`
6. Test offline:
   - DevTools → Network → Check "Offline"
   - Refresh page - all preloaded packs should still be accessible

### Expected Console Output

```
Starting preload of all travel packs for offline access...
Preloading 10 travel packs...
✓ Preloaded pack for: Paris
✓ Preloaded pack for: London
...
✓ Completed preloading 10 travel packs
```

## Benefits

1. **Offline-First**: All Tier 1 packs available immediately offline
2. **Non-Blocking**: Preloading happens in background, doesn't affect page load
3. **Automatic**: No user action required
4. **Efficient**: Batched requests prevent network overload
5. **Resilient**: Gracefully handles failures and network issues

## Configuration

You can customize preloading behavior by modifying `preloadAllPacks()` options:

```typescript
preloadAllPacks({
  batchSize: 5,    // Fetch 5 packs concurrently (default: 3)
  delayMs: 200     // 200ms delay between batches (default: 100)
});
```

## Notes

- Preloading only works when service worker is active (production mode)
- In development mode, service worker is disabled, so preloading won't cache
- Preloading is non-blocking and won't affect page performance
- All preloaded packs include full Tier 1 content for offline access
