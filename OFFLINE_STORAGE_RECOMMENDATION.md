# Offline Storage Recommendation: Travel Packs

**Requirements:** multiple city packs, read-heavy, offline, fast search.

---

## 1. Comparison: IndexedDB vs localStorage vs Cache API

| Aspect | IndexedDB | localStorage | Cache API |
|--------|-----------|--------------|-----------|
| **Quota** | Large (~50% free disk or 100s MB) | ~5–10 MB | Tied to Cache Storage, often 100s MB |
| **API** | Async | Sync | Async |
| **Shape** | Structured (objects, binary) | String only | `Request` → `Response` (opaque or cloned body) |
| **Keyed access** | Yes: get by key, range, index | No: one blob per key; must parse | Yes: by `Request`/URL |
| **Per-key read** | `store.get(citySlug)` — one pack only | Must `getItem` then `JSON.parse` the whole blob | `cache.match(url)` then `response.json()` |
| **Writes** | Put/delete one record; others untouched | `setItem` rewrites entire value; two keys = two full blobs | Put one `Request`/`Response` pair |
| **Offline** | ✅ | ✅ | ✅ (SW) |
| **Search** | Load one pack by key, search in JS | Parse full blob(s), search in JS | Fetch from cache, `response.json()`, search in JS |
| **Best for** | App data: many records, read-heavy, by-key | Tiny, infrequent config/prefs | HTTP caching (SW), not app-level structured data |

### Why not Cache API as the main app store?

Cache API is built for **HTTP response caching**. You’d store `GET /api/travel-packs?city=Paris` as a `Response`. To search, you still have to `response.json()` and run your search in JS. It doesn’t give:

- A “list of downloaded cities” without matching all URLs
- Structured access by `citySlug` independent of URL shape
- A natural place for metadata (`downloadedAt`, tier-only vs full, etc.)

Use **Cache API in the service worker** for `/api/travel-packs` and `/api/cities/list` (as in `SW_CACHING_STRATEGY.md`). For **application storage** of multiple packs and fast, keyed access, use IndexedDB (or localStorage with the caveats below).

### Why not localStorage?

- **Full-parse on every read:** `getTier1Pack(city)` today does `getTier1Packs()` → `JSON.parse(entire TIER1 blob)` → index by `citySlug`. With 10 cities × ~13 KB ≈ 130 KB, that’s 130 KB parsed on **every** `getTier1Pack`, `searchOffline`, and `getSearchEngine` init. At 20–50 cities it gets worse.
- **Full-rewrite on every write:** `storePackLocally` does two `setItem` calls, each writing a whole JSON object. Adding Paris rewrites the entire `travel-packs` and `travel-packs-tier1` strings.
- **Duplication:** Full pack and Tier1-only are stored separately; more bytes and two writes per update.
- **Quota:** 5–10 MB is enough for tens of packs at current size, but less headroom if you add tier2–4 or more cities.

localStorage is acceptable for a **small, fixed set** of cities and low read rate. For **multiple cities, read-heavy, and future growth**, it doesn’t scale as well as IndexedDB.

### Why IndexedDB?

- **Keyed reads:** `packs.get("paris")` returns only that pack. No parse of other cities. Fits read-heavy, “load one pack for this city” on every search and nav.
- **Targeted writes:** `packs.put("paris", pack)` touches one record. No full-object rewrite.
- **One store, no duplication:** Store full `StoredPack`; when the app needs Tier1 only, it reads `pack.tiers.tier1`. Optional: a separate `packTier1` store if you want a smaller read for search-only; for ~12 KB per pack, one store is enough.
- **Offline:** Same as localStorage; works without network.
- **Search:** Same as today: load the one pack for the active city, run `buildOfflineSearchIndex` or inline search in JS. IndexedDB doesn’t do full‑text search; it just makes “load only this city” cheap.
- **Scalability:** Handles many cities and larger packs without the “parse everything on every read” cost.

---

## 2. Recommendation: **IndexedDB**

Use **IndexedDB** as the primary app-level store for travel packs. Keep **Cache API** in the service worker for `/api/travel-packs` and `/api/cities/list` as a network fallback.

---

## 3. Data Schema

### 3.1 Database and object store

- **DB name:** `travel-packs-db` (or e.g. `ll-travel-packs-v1` if you version the app storage).
- **Object store:** `packs`
  - **Key:** `citySlug` (string), e.g. `"paris"`, `"new-york-city"`.
  - **Value:** one `StoredPack`-shaped object.

### 3.2 `StoredPack` (value in `packs`)

```ts
interface StoredPack {
  city: string;
  country: string;
  tiers: {
    tier1: TravelPackTier;
    tier2?: TravelPackTier;
    tier3?: TravelPackTier;
    tier4?: TravelPackTier;
  };
  downloadedAt: string; // ISO 8601
}
```

Same as today’s `StoredPack`; no separate Tier1-only store. The app uses `pack.tiers.tier1` where it currently uses `getTier1Pack`’s return value.

### 3.3 Indexes (optional)

- **Key path:** `citySlug` is the primary key; `get(citySlug)` is enough for “pack by city”.
- Optional index on `downloadedAt` if you need “list by most recently downloaded” or LRU eviction without scanning. Not required for MVP.

### 3.4 No separate search index in IDB

Keep search as: **get pack by `citySlug` → run `buildOfflineSearchIndex(pack)` or existing `searchOffline` / `OfflineSearchEngine` in memory.**  
Storing a prebuilt `OfflineSearchIndex` in a second object store can be added later if profiling shows that building the index is hot; for ~12 KB and &lt;200 ms target, build-on-read is fine.

---

## 4. How Packs Are Stored

### 4.1 Write: `storePack(pack: TravelPack)`

1. `citySlug = toSlug(pack.city)` (e.g. `pack.city.toLowerCase().replace(/\s+/g, "-")`).
2. `value = { ...pack, downloadedAt: new Date().toISOString() }`.
3. `packs.put(citySlug, value)`.

One record per city; put is create-or-replace. No need to read other cities or rewrite a global blob.

### 4.2 Read: `getPack(cityName: string): Promise<StoredPack | null>`

1. `citySlug = toSlug(cityName)`.
2. `return packs.get(citySlug)`.

Returns only that pack or `undefined`/`null` if missing.

### 4.3 List: `getDownloadedCities(): Promise<string[]>` or `getPackKeys(): Promise<string[]>`

- `packs.keys()` (or `getAllKeys()`), then map to `city` if you store it, or use `citySlug` as the downloaded-city id.  
- For “display name” you can either store `city` in the value and use it, or maintain a small `citySlug → city` map in memory from the last `getPack`/`getAll` run.

### 4.4 Eviction (e.g. when quota is tight)

- Sort by `downloadedAt` (asc = oldest first).
- Delete oldest N or oldest until under a size limit.  
If you add an index on `downloadedAt`, this can be a range scan; otherwise one `getAll()` and sort in JS is acceptable for tens of packs.

---

## 5. How the Active Pack Is Selected

**There is no “active pack” field in storage.** The active pack is entirely determined by **UI state + one IDB read**.

### 5.1 In-memory state

- `city: string` — the selected city (e.g. `"Paris, Île-de-France, France"` or `"Paris"`). Set by the city selector / `handleSelect`.
- `pack: TravelPack | null` — the pack currently shown. Set from storage or network.

### 5.2 Selection flow

1. User selects a city → `setCity(selected)` (and e.g. `setCityQuery(selected)`).
2. Effect depends on `city`:
   - `cityNameOnly = city.split(",")[0].trim()` (or your existing normalizer).
   - **Offline-first:** `pack = await getPack(cityNameOnly)` from IndexedDB.
   - If `pack` exists: `setPack(pack)`, done. Optionally in the background: `fetch(/api/travel-packs?city=...)` and on success `storePack(result)` and `setPack(result)`.
   - If `pack` is null: `fetch(/api/travel-packs?city=...)`; on success `storePack(result)` and `setPack(result)`; on network failure show “Pack not downloaded” / “Offline”.

### 5.3 Search and navigation

- **Search:** `searchOffline(cityName, query)` (and `OfflineSearchEngine`) take `cityName`. Resolve `cityName` from the current `city` state, then `getPack(cityName)` (or use an already-loaded `pack` in React state so you don’t re-read IDB on every keystroke). Run the existing in-memory search on `pack.tiers.tier1`.
- **Navigation (ProblemFirstNavigation, etc.):** They receive `pack` as a prop. `pack` is the active pack from `setPack`; no extra “active” lookup in storage.

### 5.4 Summary

- **Stored:** one record per `citySlug` in `packs`; no “active” flag.
- **Active pack:** the pack for the currently selected `city`, loaded via `getPack(toSlug(city))` and held in `pack` state.  
This matches the current mental model: `city` is the selector, `getTier1Pack`/`getPack` is the lookup.

---

## 6. Migration from localStorage

1. **One-time:** On first load with the new IDB-based `offlineStorage`:
   - Read `localStorage.getItem("travel-packs-tier1")` (or `"travel-packs"` if you prefer full packs).
   - `JSON.parse`; for each `(citySlug, p)` in the object, `await storePack(p)` (or `{ city, country, tier1, downloadedAt }` → build a `StoredPack` and `storePack` it).
   - Optionally `localStorage.removeItem("travel-packs")` and `removeItem("travel-packs-tier1")` after a successful migration.
2. **API wrapper:** Provide `getTier1Pack(cityName)` that does `getPack(cityName)` and returns `pack ? { city: pack.city, country: pack.country, tier1: pack.tiers.tier1, downloadedAt: pack.downloadedAt } : null` so `searchOffline`, `OfflineSearchEngine`, and `page.tsx` can stay the same on the read side. `storePackLocally` becomes `storePack` (async) and is awaited where it’s called.

---

## 7. Suggested File Layout

- **`src/lib/offlineStorageIdb.ts`** (or replace `offlineStorage.ts`):
  - `openDB()`, `storePack()`, `getPack()`, `getDownloadedCities()`, `deletePack()`, `clearPacks()`.
  - Helpers: `toSlug()`, `getTier1Pack(cityName)` implemented via `getPack` + reshape.
- **Existing callers:**  
  - `storePackLocally` → `await storePack` (in `page.tsx`, `preloadPacks`).  
  - `getTier1Pack` → `getTier1Pack` from the IDB layer (async; callers need to `await` or use in `useEffect`/`use`).  
  - `getTier1Packs` → `getDownloadedCities` (or a `getAllPacks()` that returns `Record<citySlug, StoredPack>`) if anything still needs the full map.

---

## 8. Small Implementation Notes

- Use **idb** (or Dexie) to avoid the raw IDB callback API and versioning boilerplate.
- Open the DB once (e.g. at module load or first `getPack`), reuse the connection.
- `getPack` and `storePack` can be used from both main thread and, if you ever do offline work in a worker, from a worker (IDB is available there too).
