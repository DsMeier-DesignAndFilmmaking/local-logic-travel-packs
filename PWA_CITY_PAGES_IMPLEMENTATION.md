# City Pack Pages Implementation - Step 3 Complete

## Overview

Successfully implemented city-specific pack pages with manifest injection only on city pages, ensuring the homepage does NOT have a manifest.

## What Was Implemented

### 1. City Pack Page Route
**File:** `src/app/packs/[city]/page.tsx`

- New route: `/packs/[city]` (e.g., `/packs/bangkok`, `/packs/new-york-city`)
- Loads pack from IndexedDB first (offline-first)
- Falls back to API if not in IndexedDB
- Automatically saves pack to IndexedDB when loaded
- Displays pack using existing `PackCard` and `OfflineDownload` components
- **Injects city-specific manifest** dynamically when pack loads

**Key Features:**
- ✅ Offline-first: Checks IndexedDB before API
- ✅ Automatic manifest injection: Only on city pages
- ✅ Clean navigation: Back button to homepage
- ✅ Error handling: Redirects to home if pack not found
- ✅ Service worker caching: Caches page when pack loads

### 2. Removed Manifest from Homepage
**File:** `src/app/layout.tsx`

- ✅ Removed `manifest: '/manifest.json'` from root metadata
- ✅ Added comment explaining manifests are only on city pages
- ✅ Homepage now has NO manifest link

### 3. Updated Homepage Navigation
**File:** `src/components/TravelPackCitySelector.tsx`

- ✅ Simplified component: Now only shows city selector
- ✅ Navigates to `/packs/[city]` when city is selected
- ✅ Removed all manifest update logic (handled by route now)
- ✅ Removed inline pack display (moved to city page)

**Flow:**
1. User selects city → Navigates to `/packs/{city}`
2. City page loads → Injects city-specific manifest
3. User can "Add to Home Screen" → Gets city-specific installation

## How It Works

### Manifest Injection Flow

1. **User visits `/packs/bangkok`**
2. **Page loads pack** (from IndexedDB or API)
3. **useEffect detects pack loaded**
4. **Removes any existing manifest link**
5. **Injects city-specific manifest:** `<link rel="manifest" href="/api/manifest/bangkok">`
6. **User taps "Add to Home Screen"** → iOS reads city-specific manifest
7. **App installs** with Bangkok-specific configuration

### Homepage Behavior

- **No manifest link** in document head
- **No PWA installation** possible from homepage
- **City selection** navigates to city-specific page
- **City page** has manifest for installation

### Cleanup

- When navigating away from city page, manifest is removed
- Ensures no manifest leaks to other pages

## Route Structure

```
/                           → Homepage (NO manifest)
/packs/bangkok              → Bangkok pack page (HAS manifest)
/packs/paris                → Paris pack page (HAS manifest)
/packs/new-york-city        → New York pack page (HAS manifest)
```

## Files Changed

- ✅ `src/app/packs/[city]/page.tsx` (NEW)
- ✅ `src/app/layout.tsx` (UPDATED - removed manifest)
- ✅ `src/components/TravelPackCitySelector.tsx` (UPDATED - simplified, navigates to city page)

## Testing

### Test Homepage Has No Manifest

1. Visit `http://localhost:3000/`
2. Open browser console:
   ```javascript
   document.querySelector('link[rel="manifest"]')
   // Should return: null
   ```
3. ✅ Homepage has NO manifest

### Test City Page Has Manifest

1. Visit `http://localhost:3000/packs/bangkok`
2. Wait for pack to load
3. Check manifest link:
   ```javascript
   document.querySelector('link[rel="manifest"]').href
   // Should show: "/api/manifest/bangkok"
   ```
4. ✅ City page HAS city-specific manifest

### Test Navigation Flow

1. Visit homepage
2. Select a city (e.g., "Bangkok")
3. Should navigate to `/packs/bangkok`
4. Manifest should be injected automatically
5. Click "Back to Home"
6. Should return to homepage with no manifest

## Next Steps

### ⚠️ Service Worker Updates Needed

The service worker still needs to be updated to:
1. Cache city-specific routes (`/packs/[city]`)
2. Restrict caching to single city's data
3. Handle city-specific scope

### Future Enhancements

1. **Preload city pages** when city is selected on homepage
2. **Add loading states** during navigation
3. **Handle deep links** to city pages from PWA installations

## Notes

- Manifest is injected client-side using `useEffect`
- Manifest is cleaned up when navigating away
- Homepage intentionally has no manifest to prevent full app installation
- City pages are the only place where PWA installation is possible
- This ensures each installation is city-specific
