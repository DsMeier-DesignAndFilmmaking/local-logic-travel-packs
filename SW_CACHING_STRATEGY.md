# Service Worker Caching Strategy

Design for the travel pack PWA: precache UI shell, precache/runtime-cache pack JSON, full offline navigation, and minimal stale-UI risk.

---

## 1. Cache Types

| Cache | Purpose | Populated | Eviction |
|-------|---------|-----------|----------|
| **workbox-precache-v2-…** | App shell: `/`, `_next/static/chunks/*`, `_next/static/css/*`, `manifest.json`, `public/*` (icons, favicon, etc.) | **Install** (build manifest) | **Activate**: `cleanupOutdatedCaches` removes precache entries from previous builds |
| **travel-packs** | Pack JSON: `GET /api/travel-packs?city=*` | **Runtime** (on first fetch per city) | `maxEntries: 32`, `maxAgeSeconds: 7d` |
| **cities-list** | City list: `GET /api/cities/list` | **Runtime** | `maxEntries: 1`, `maxAgeSeconds: 1d` |
| **cities-search** | Autocomplete: `GET /api/cities?q=*` | **Runtime** | `maxEntries: 16`, `maxAgeSeconds: 1h` |
| **apis** (default) | Other `/api/*` | Runtime | 24h, 16 entries |
| **others** (default) | Same-origin non-API (e.g. fallbacks) | Runtime | 24h |

Precache = shell only. Pack JSON and cities are **runtime** so we don’t need build-time API calls. `storePackLocally` in the app remains the primary offline source for packs; SW cache is a fallback when `fetch` is used and the network fails.

---

## 2. Install / Activate Behavior

### Install

1. **Precache**  
   - Workbox reads the build manifest (from next-pwa): `/`, `/_next/static/*` (client chunks, CSS), `manifest.json`, and `public/**/*` (icons, favicon, etc.), excluding `sw.js`, `workbox-*.js`, `worker-*.js`.  
   - All entries are added to `workbox-precache-v2-<hash>` with a revision (content hash for built assets, file hash for `public/`).

2. **No extra install work**  
   - We do not precache `/api/travel-packs` or `/api/cities/list` at build time. Pack and city data are filled at runtime on first request.

### Activate

1. **`cleanupOutdatedCaches: true`** (default)  
   - On activate, Workbox deletes caches whose names are not in the current version’s allowlist. That includes old `workbox-precache-v2-*` from previous builds, so old shell assets are dropped.

2. **`skipWaiting: true`**  
   - The new SW moves from waiting to active as soon as it’s ready, without requiring the user to close all tabs.

3. **`clientsClaim: true`**  
   - The active SW takes control of existing clients (tabs) on next navigation. New navigations and `fetch` (including from existing pages) are handled by the new SW.

---

## 3. Fetch Strategy

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| **`/` (start URL)** | **NetworkFirst** (injected by next-pwa when `dynamicStartUrl`) | Fresh HTML when online; cached HTML when offline. Avoids serving an old shell when a new deploy exists and the user has network. |
| **`/_next/static/*`** (JS, CSS) | **Precache (Cache-first in practice)** | Served from precache. No runtime rule overrides. Content-addressed filenames; new build = new URLs = new precache entries. Old entries are removed by `cleanupOutdatedCaches`. |
| **`/manifest.json`, `/icon-*`, `/favicon.ico`** | **Precache (Cache-first)** | From `public/`; same as above. |
| **`/api/travel-packs?city=*`** | **NetworkFirst** (fallback: cache), 10s timeout, 7d | Prefer fresh pack when online; use last cached response when offline or slow network. Long TTL for occasional travel use. |
| **`/api/cities/list`** | **NetworkFirst**, 10s timeout, 1d | Fresh list when online; offline fallback for preload and “downloaded cities”. |
| **`/api/cities?q=*`** | **NetworkFirst**, 10s timeout, 1h | Autocomplete; shorter TTL. |
| **Other `/api/*`** | **NetworkFirst** (default next-pwa), 10s, 24h | Keeps existing behavior. |
| **Same-origin non-API** | **NetworkFirst** (default), 10s | Fallbacks, etc. |

So:

- **Shell**: precache → effectively **cache-first**; no network in the critical path for static assets.
- **Start URL `/`**: **network-first** so a new HTML shell can be loaded when online after a deploy.
- **Pack JSON and cities**: **network-first** with cache fallback and `networkTimeoutSeconds: 10` so we don’t hang offline.

---

## 4. Update Rules

### When a New SW Is Used

- **Deploy** produces a new `sw.js` and `workbox-*.js` with a new precache manifest (revisions for changed files, new filenames for new chunks).
- **Browser** downloads the new SW when it does a navigation/refresh or when `updatefound` fires after `registration.update()`.
- **`skipWaiting`** makes the new SW activate as soon as it’s installed; the old SW stops handling `fetch`/events.
- **`clientsClaim`** ensures the new SW controls all clients; the next `fetch` or navigation uses the new SW and thus the new precache and runtime rules.

### Cache Versioning and Invalidation

- **Precache**  
  - Versioned implicitly: each build has a new manifest and new/updated `revision` values.  
  - `cleanupOutdatedCaches` on activate removes old precache caches.  
  - No explicit “version” string; Workbox’s precache model is enough.

- **Runtime (travel-packs, cities-list, cities-search)**  
  - Versioned by `cacheName` only. We use fixed names; eviction is by `maxAgeSeconds` and `maxEntries`.  
  - If we ever need a “breaking” change for a runtime cache (e.g. new API shape), we can bump the cache name (e.g. `travel-packs-v2`); the old cache will stay until expiration and will simply no longer be used.

### Avoiding Stale UI

1. **Shell (JS/CSS)**  
   - Served from precache with content-derived revisions.  
   - New build → new chunk names or new revisions → new precache entries.  
   - Old precache is deleted on activate.  
   - **Caveat**: A page that’s already loaded keeps running its current JS until reload. The new SW will serve new assets only for *future* navigations/refreshes. To force a reload, the app could listen for `controllerchange` and call `window.location.reload()` or show “New version; refresh” (optional, not in base design).

2. **Start URL `/`**  
   - NetworkFirst: when online, we fetch the latest HTML; when offline, we use the last cached document. This limits stale HTML to “offline directly after an update” (acceptable).

3. **Pack and cities data**  
   - NetworkFirst: online gets fresh data; offline uses last cached response. Staleness is bounded by the last successful fetch before going offline.

---

## 5. Order of `runtimeCaching` Rules

More specific patterns must come **before** generic ones:

1. `/api/travel-packs` (and `?city=…`)
2. `/api/cities/list`
3. `/api/cities` with query (autocomplete)
4. next-pwa default rules (other `/api/`, same-origin, cross-origin)

---

## 6. What We Do *Not* Do

- **Precache pack JSON at build**  
  - Would require build-time fetch or static JSON in `public/`. Omitted; packs are filled at runtime and via `storePackLocally`.

- **Cache-first for `/` or `_next/static`**  
  - `/` uses NetworkFirst (next-pwa) so we can pick up new HTML.  
  - `_next/static` stays in precache only; we don’t add a cache-first runtime rule for it.

- **StaleWhileRevalidate for pack/cities**  
  - We prefer NetworkFirst so that when online we always try to get fresh data first; SWR would often serve stale and update in the background, which can cause brief mismatches (e.g. old pack + new UI).

- **`reloadOnOnline`**  
  - next-pwa supports it; we leave it at its default. It can reload when the browser goes from offline to online; optional to enable depending on product preference.

---

## 7. Files Touched

- **`next.config.js`**  
  - `runtimeCaching`: prepend travel-packs, cities-list, cities-search to next-pwa’s default (`require('next-pwa/cache')`).  
  - Keep `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches` (defaults) and `dest: 'public'`, `disable` in dev.

- **Optional later**  
  - `preloadPacks.ts`: after each pack fetch, call `storePackLocally` so `getTier1Pack` is the source of truth and SW is only a fallback.  
  - `additionalManifestEntries`: add a static starter pack (e.g. `/packs/paris-tier1.json`) and a first-run seed into `localStorage` if we add that build artifact and route.
