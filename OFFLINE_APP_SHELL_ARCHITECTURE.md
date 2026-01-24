# Offline-First App Shell Architecture

## Goal

App behaves like it **“lost internet”**, not like it **“can’t function”**.

- Loads instantly  
- Works without network  
- Uses cached UI + local JSON data  
- Feels like a native app  

**Target: web viewport first.**

---

## 1. App Shell Components

### 1.1 Shell (cached, same online/offline)

| Component | Role | Cached | Notes |
|-----------|------|--------|-------|
| **Document** | `index.html` (or `/` SSR/SSG) | ✓ Precache | Minimal HTML; no critical data in markup. |
| **Layout** | `layout.tsx` → `<html>`, `<body>`, fonts, `<meta>`, manifest | ✓ Precache | Fonts: self-host or `font-display: optional` so text shows if font fails. |
| **Global CSS** | `globals.css`, Tailwind output | ✓ Precache | Variables, base styles. No `url()` to uncached assets. |
| **Main JS** | Next `_next/static/chunks/*` for `/` | ✓ Precache | Framework, React, page component. |
| **Icons / static** | `manifest.json`, `icon-192`, `icon-512`, `favicon.ico` | ✓ Precache | PWA and app icon. |

**Shell = everything needed to paint the first frame and interact (skeleton, city input, nav) without a network round-trip.**

### 1.2 Below-the-fold / deferred (non-blocking)

| Component | Role | When | Offline |
|-----------|------|------|---------|
| **City autocomplete** | Suggestions from `/api/cities` | On typing | ✗ Network; hide or show “Use a downloaded city” when offline. |
| **Pack JSON** | Tier1+ data | On city select or from cache | ✓ localStorage or SW cache. |
| **Preload** | Fetch packs in background | After shell idle | Fails silently offline; only warms cache when online. |

### 1.3 Shell render order (first load)

```
1. Document + Layout + critical CSS
2. Main JS (hydrate)
3. Page: hero, city input, static copy
4. (Defer) Preload, city suggestions, pack fetch
```

**No `fetch` or `import()` in the shell’s critical path.** Pack load and preload run after first paint.

---

## 2. What Gets Cached on Install

### 2.1 Service worker precache (on install / at build)

Precache these so they are available before any network:

| Resource | Source | Example |
|----------|--------|---------|
| `/` | Next HTML or static | `start_url` |
| `/_next/static/chunks/pages/_app-*.js` | Build | Framework runtime |
| `/_next/static/chunks/pages/index-*.js` | Build | Home page |
| `/_next/static/css/*.css` | Build | Global + page CSS |
| `/manifest.json` | `public/` | PWA manifest |
| `/icon-192x192.png`, `/icon-512x512.png` | `public/` | Icons |
| `/favicon.ico` | `public/` | Favicon |

**Optional (recommended):** pre-generate and precache a **starter pack** so the app works fully offline after install even if the user has never picked a city:

- e.g. `/packs/paris-tier1.json` (or `/api/travel-packs?city=Paris` if you add it to the precache list at build time).
- On first load, the shell checks `getTier1Pack('Paris')` or `fetch('/packs/paris-tier1.json')`; if missing, it can seed from the precached JSON into localStorage once.

### 2.2 Not in precache (runtime only)

- `/api/cities?q=*` — autocomplete; network-only or SW runtime cache.
- `/api/travel-packs?city=*` — pack API; cached at runtime after first fetch (see §4).
- `/api/cities/list` — city list for preload; can be runtime-cached or replaced by a static `cities.json` in precache.

---

## 3. What Is Required for First Load

### 3.1 Minimum for “instant” first paint (no network)

Must be in the **precached shell**:

- HTML for `/`
- CSS (layout, typography, tokens)
- JS for layout + home page
- Fonts (or system fallback; `font-display: optional` so render isn’t blocked)
- `manifest.json` and icons (for “Add to Home Screen” and splash)

**No API call, no `getTier1Pack`, no `fetch` in the critical path.** The first frame is static.

### 3.2 Minimum for “full offline” (pick city + use pack)

- **Shell** (as above).
- **At least one pack in local storage or in a precached JSON.**  
  - Either: user has already selected a city while online (pack in `localStorage` via `storePackLocally`),  
  - Or: a starter pack (e.g. Paris) is precached and, on first run, copied into `localStorage` or made available to `getTier1Pack`.

### 3.3 First-load flow (recommended)

```
[User opens /]
  → SW serves precached shell (if installed) or network
  → First paint: layout + city input + “Designed for offline” copy

[User has no packs in localStorage]
  → City input works; autocomplete disabled or “Offline: choose a downloaded city” (empty until a pack exists)
  → If starter pack precached: on first idle, app seeds `localStorage` from /packs/paris-tier1.json (or equivalent)
  → User can type "Paris" and, if Paris is in the seeded list, select it and see the pack from localStorage

[User has packs in localStorage]
  → City input: offline, show only downloaded cities (from getTier1Packs keys) or a static list if you precache cities.json
  → On select: getTier1Pack(city) → render pack, search, nav. No network.
```

---

## 4. What Updates When Online

### 4.1 While online

| What | When | How |
|------|------|-----|
| **Pack data** | After user selects a city | `fetch /api/travel-packs?city=X` → `storePackLocally(pack)`. If already in localStorage, optional background re-fetch and replace. |
| **Preload** | After first paint (e.g. `requestIdleCallback` or `setTimeout`) | `fetch /api/cities/list` → for each city, `fetch /api/travel-packs?city=X` → `storePackLocally`. Warms localStorage for later offline. |
| **City list for autocomplete** | On city input focus/typing | `fetch /api/cities?q=...`. Optional: SW runtime cache with short TTL. |
| **App shell (JS/CSS)** | On navigate or refresh | SW: `StaleWhileRevalidate` or `NetworkFirst` for `/_next/static/*` and `/`. New build replaces precache on SW update. |

### 4.2 Service worker runtime cache (when online)

So that “lost internet” still serves recent API data from cache:

| Pattern | Strategy | Use |
|---------|----------|-----|
| `/_next/static/*` | `StaleWhileRevalidate` or `CacheFirst` | JS/CSS; long-lived. |
| `/api/travel-packs*` | `NetworkFirst` (fallback: cache), e.g. 7d | Pack JSON. Offline: last cached response. |
| `/api/cities/list` | `NetworkFirst` (fallback: cache), e.g. 1d | City list for preload. |
| `/api/cities?*` | `NetworkFirst` (fallback: cache), e.g. 1h | Autocomplete; optional. |

**Important:** `storePackLocally` remains the primary source for “I have this pack offline.” SW cache is a fallback when `fetch` is used and the network fails.

### 4.3 SW update and precache

- On **next build**, SW digest changes; `skipWaiting` + `clients.claim` (or prompt) so new precache and routes take effect.
- **Precache** is filled at install/activate from the build manifest. Old cache entries for deprecated JS/CSS can be dropped in `activate`.

---

## 5. Web Viewport First

### 5.1 Viewport and shell

- **Shell width:** `100vw`; main content `max-width` (e.g. 640px) centered. No fixed heights that assume a certain screen.
- **Above the fold:** Hero, city input, and at least one CTA. Pack block appears after city is selected; it is not in the shell’s first paint.
- **Touch:** 44px min tap targets; `touch-action: manipulation` where needed.

### 5.2 No viewport-dependent loading

- **No** “if mobile, load X; if desktop, load Y” in the shell. One JS bundle for the home route; code-splitting only for heavy, below-the-fold or lazy routes.
- **No** `prefers-reduced-motion` or `prefers-color-scheme` blocking first paint; they only switch behavior after load.

---

## 6. Data Flow Summary

```
                    ┌─────────────────────────────────────────┐
                    │           PRECACHE (on install)         │
                    │  /, _next/static/*, manifest, icons,    │
                    │  optional: /packs/paris-tier1.json      │
                    └─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────┐     first paint      ┌──────────────────────┐
│   Request   │ ──────────────────►  │   Shell (HTML+JS+CSS)│
│     /       │                      │   City input, hero   │
└─────────────┘                      └──────────────────────┘
        │                                        │
        │ (online)                                │ (idle)
        ▼                                        ▼
┌─────────────────┐                    ┌─────────────────────┐
│ runtime cache   │                    │ Preload (optional)  │
│ /api/travel-*   │                    │ /api/cities/list    │
│ /api/cities/*   │                    │ → /api/travel-packs │
└─────────────────┘                    │ → storePackLocally  │
        │                              └─────────────────────┘
        │ (on city select)                         │
        ▼                                          │
┌─────────────────┐     getTier1Pack   ┌───────────▼──────────┐
│ /api/travel-    │ ◄── (if missing) ──│  localStorage        │
│   packs?city=X  │                    │  TIER1_STORAGE_KEY   │
└────────┬────────┘                    └───────────┬──────────┘
         │ storePackLocally                        │
         └─────────────────────────────────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ Pack UI              │
               │ ProblemFirstNav,     │
               │ OfflineSearch, etc.  │
               └──────────────────────┘
```

---

## 7. Implementation Checklist

### 7.1 Shell and precache

- [ ] Ensure `/` and `/_next/static/*` (for the home route) are in the SW precache.
- [ ] `manifest.json` has `start_url: "/"`, `display: "standalone"`.
- [ ] Fonts: self-host or `font-display: optional` so first paint isn’t blocked.
- [ ] No `fetch` in the critical path of the shell or home page; pack load and preload run in `useEffect` or `requestIdleCallback`.

### 7.2 Pack and cities

- [ ] `getTier1Pack(city)` before any `fetch` when a city is selected; if present, render from localStorage and skip network.
- [ ] On successful `fetch(/api/travel-packs?city=X)`, call `storePackLocally(pack)`.
- [ ] Preload: after fetch of each pack, call `storePackLocally` (in addition to or instead of relying only on SW cache).
- [ ] (Optional) Precache a starter pack (e.g. Paris) and seed `localStorage` once on first load so the app works fully offline after install.

### 7.3 Service worker

- [ ] Precache: `/`, `_next/static` (home), `manifest.json`, icons.
- [ ] Runtime: `NetworkFirst` for `/api/travel-packs*` and `/api/cities/list` (and optionally `/api/cities?*`) so recent responses are available when the network fails.
- [ ] `skipWaiting` (or update UX) and `clients.claim` so new builds take effect.

### 7.4 Offline UX

- [ ] City autocomplete: when offline, hide or replace with “Downloaded: …” from `getTier1Packs()` (or a precached city list).
- [ ] Pack fetch: no “No internet” error if `getTier1Pack` returns data; only show an error when the user selects a city that is not in localStorage and the network is unavailable.
- [ ] No blocking “Checking connection…” in the shell; connectivity checks run in the background for search enhancements, etc.

---

## 8. Files to Touch (reference)

| Area | Files |
|------|-------|
| **Precache / SW** | `next.config.js` (next-pwa: precache `_next/static`, `/`, static; add runtimeCaching for `/api/*`). |
| **Starter pack** | Build step to output `/packs/paris-tier1.json` (or similar) and add to precache; or include `/api/travel-packs?city=Paris` in a precache allowlist if the build can do that. |
| **Preload** | `preloadPacks.ts`: after `fetch` + `response.json()`, call `storePackLocally` with the parsed pack. |
| **City when offline** | `page.tsx` or `CityInput`: if offline, populate city suggestions from `Object.keys(getTier1Packs())` or a precached `cities.json` instead of `/api/cities`. |
| **Layout** | `layout.tsx`: ensure `font-display: optional` (or equivalent) for any webfont. |

---

## 9. Out of Scope Here

- Auth, premium, or paid pack flows.
- Tier2/3/4 offline strategy (can mirror Tier1 with separate keys or feature flags).
- Offline queue for analytics or sync.
- Platform-specific (e.g. TWA, Capaccio) beyond `manifest` and `start_url`.
