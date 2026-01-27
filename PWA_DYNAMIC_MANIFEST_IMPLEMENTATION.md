# Dynamic Manifest Implementation - Step 2 Complete

## Overview

Successfully implemented dynamic, city-specific manifest generation to enable city-specific "Add to Home Screen" installations on iOS.

## What Was Implemented

### 1. Dynamic Manifest API Route
**File:** `src/app/api/manifest/[city]/route.ts`

- Generates city-specific manifests on-demand
- Route pattern: `/api/manifest/[city]` (e.g., `/api/manifest/bangkok`)
- Validates city exists before generating manifest
- Returns proper `application/manifest+json` content type

**Key Features:**
- ✅ City-specific `start_url`: `/packs/{city}?source=a2hs`
- ✅ City-specific `scope`: `/packs/{city}`
- ✅ City-specific `id`: `/packs/{city}`
- ✅ City-specific `name`: "{City} Travel Pack"
- ✅ City-specific `short_name`: "{City}"
- ✅ Fallback icons (uses default icons if city-specific icons don't exist)
- ✅ Proper caching headers (1 hour cache)

**Example Output for `/api/manifest/bangkok`:**
```json
{
  "name": "Bangkok Travel Pack",
  "short_name": "Bangkok",
  "description": "Offline-first travel intelligence for Bangkok",
  "id": "/packs/bangkok",
  "start_url": "/packs/bangkok?source=a2hs",
  "scope": "/packs/bangkok",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#0F172A",
  "categories": ["travel", "productivity"],
  "icons": [...]
}
```

### 2. Manifest Utility Functions
**File:** `src/lib/manifest.ts`

Utility functions for managing manifest links:

- `getCityManifestUrl(cityName: string)`: Generates normalized manifest URL
- `updateManifestLink(manifestUrl: string)`: Updates the `<link rel="manifest">` tag in document head
- `resetManifestLink()`: Resets to default app-wide manifest

### 3. Automatic Manifest Updates
**File:** `src/components/TravelPackCitySelector.tsx`

Updated to automatically switch manifest when a city is selected:

- ✅ Updates manifest link when city pack is loaded
- ✅ Updates manifest link when initial pack is recovered from IndexedDB
- ✅ Resets manifest link when user switches cities

**Flow:**
1. User selects a city → Pack loads → Manifest link updates to city-specific manifest
2. User opens app with saved pack → Initial pack loads → Manifest link updates
3. User clicks "Switch City" → Manifest link resets to default

## How It Works

### Installation Flow (iOS)

1. **User selects a city** (e.g., "Bangkok")
2. **Pack loads** → `TravelPackCitySelector` calls `updateManifestLink('/api/manifest/bangkok')`
3. **Manifest link updates** → `<link rel="manifest" href="/api/manifest/bangkok">` in document head
4. **User taps "Add to Home Screen"** → iOS reads the current manifest link
5. **City-specific manifest is used** → App installs with Bangkok-specific configuration
6. **App launches** → Opens to `/packs/bangkok?source=a2hs` (city-specific route)

### URL Structure

- **Manifest API:** `/api/manifest/{normalized-city}`
  - Example: `/api/manifest/bangkok`
  - Example: `/api/manifest/new-york-city`

- **Start URL (in manifest):** `/packs/{normalized-city}?source=a2hs`
  - Example: `/packs/bangkok?source=a2hs`

- **Scope (in manifest):** `/packs/{normalized-city}`
  - Example: `/packs/bangkok`

## Next Steps Required

### ⚠️ Important: Route Creation Needed

The manifest references `/packs/{city}` routes, but these routes don't exist yet. You'll need to:

1. **Create `/app/packs/[city]/page.tsx`** - City-specific pack page
2. **Update routing** - Handle city-specific routes instead of just query params
3. **Update service worker** - Cache city-specific routes

### Future Enhancements

1. **City-Specific Icons**
   - Create `/public/icons/{city}-192.png` and `/public/icons/{city}-512.png` for each city
   - Currently falls back to default icons

2. **Service Worker Updates**
   - Update service worker scope to be city-aware
   - Restrict caching to single city's data

3. **Installation Detection**
   - Detect when user initiates "Add to Home Screen"
   - Ensure manifest is updated before installation prompt

## Testing

To test the dynamic manifest:

1. **Start the dev server:** `npm run dev`
2. **Select a city** in the app (e.g., Bangkok)
3. **Check the manifest link:**
   ```javascript
   // In browser console
   document.querySelector('link[rel="manifest"]').href
   // Should show: "/api/manifest/bangkok"
   ```
4. **Visit manifest URL directly:**
   - Navigate to `http://localhost:3000/api/manifest/bangkok`
   - Should return JSON manifest with Bangkok-specific configuration

## Files Changed

- ✅ `src/app/api/manifest/[city]/route.ts` (NEW)
- ✅ `src/lib/manifest.ts` (NEW)
- ✅ `src/components/TravelPackCitySelector.tsx` (UPDATED)

## Notes

- The manifest uses normalized city names (e.g., "new-york-city" not "New York City")
- City validation ensures only cities with travel packs can generate manifests
- Manifest includes fallback icons if city-specific icons don't exist
- Manifest is cached for 1 hour to reduce server load
