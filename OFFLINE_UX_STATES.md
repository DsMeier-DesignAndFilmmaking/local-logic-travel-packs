# Offline UX States

**Goal:** Every offline-related state feels **intentional**, not like something broke. Native app–level clarity.

**Inputs:**
- **Connectivity:** `online` | `poor` | `offline` (from `navigator.onLine` + `checkConnectivity` or `ConnectivityMonitor`).
- **Pack state:** `none` | `downloading` | `cached` | `update_available` (for current city).
- **Current city:** selected or empty.

---

## State 1: Fully Offline (Ideal)

**When:** Connectivity = `offline` **and** pack for current city is **cached** (`getTier1Pack(city)` exists).

### What the user sees

- **Shell:** Same as online. Hero, city input, pack card. No “you’re offline” banner.
- **Pack header:** City name, “Offline-ready • Problem-first navigation”, “Tier 1 Available”, Offline Search, problem cards, Download (or “Already saved for offline”).
- **City input:**  
  - **Autocomplete:** Hidden. Replaced by a short note: *“Offline: choose a downloaded city”* and a list of **downloaded cities** from `getTier1Packs()` (e.g. chips or a compact list). Tapping a chip = select that city.
- **Offline Search:** Visible, works. Placeholder e.g. *“Search: toilet, ATM, food, metro…”*
- **Voice:** Works (on‑device STT). Same as online.
- **Problem cards, MicroSituations, Actions:** All visible and tappable. Same hierarchy and layout.
- **Tier 2/3/4, Spontaneity:** Hidden or a single line: *“More when you’re back online.”*
- **Download / Tier1Download:**  
  - **Primary:** *“Already saved for offline”* (disabled or tertiary style).  
  - Or hidden when we’re confident the pack is cached.

### Actions allowed

- Change city (only to a **downloaded** city from the list).
- Search (text + voice).
- Navigate: cards → microSituations → actions. Back, Home.
- Copy/share actions (if we add that). No network‑dependent actions.

### Messaging

- **No global banner.** Offline is the expected, designed-for mode.
- **City input (when focused, no city yet):**  
  - *“Offline: choose a downloaded city”*  
  - List: *“Paris”*, *“London”*, etc. (from `getTier1Packs()`).
- **Empty downloaded list:**  
  - *“No cities downloaded yet. Add one when you’re back online.”*
- **Pack subtitle (optional, low emphasis):**  
  - *“Using your saved copy”* or *“Offline”* — small, non‑alarming.

---

## State 2: Weak Network

**When:** Connectivity = `poor` (slow or unstable) **or** requests are timing out. Pack may or may not be cached.

### What the user sees

- **Shell:** Same as online/offline. No blocking overlay.
- **Banner (non‑blocking, dismissible or auto‑hide after a few seconds):**  
  - *“Connection is slow. Using your saved data.”* (if pack cached)  
  - Or: *“Connection is slow. Some features may be unavailable.”* (if no pack for this city).
- **City input:**  
  - **Autocomplete:** Shown, but with a short line: *“Suggestions may be slow.”*  
  - We **do** trigger `/api/cities` on type; if it times out, we clear suggestions and optionally: *“Couldn’t load suggestions. Try a downloaded city.”* and show `getTier1Packs()` as fallback.
- **Pack (if cached):** Full UI. Offline Search, cards, voice, Download. Same as Fully Offline.
- **Pack (if not cached):** See “No pack downloaded yet” below; we may be in “Pack downloading” if a fetch is in progress.
- **Background refresh:** If we have a cached pack and try to refresh in the background, we use a short timeout (e.g. 3–5s). On failure: no message; we keep the cached pack.

### Actions allowed

- **If pack cached:** Same as Fully Offline. Optionally: tap “Try again” for city suggestions or pack refresh; we don’t block.
- **If pack not cached:** Only: pick a downloaded city, or wait for “Pack downloading” to finish / fail.

### Messaging

- **Banner:**  
  - *“Connection is slow. Using your saved data.”* (cached)  
  - *“Connection is slow. Some features may be unavailable.”* (no pack).
- **City suggestions timeout:**  
  - *“Couldn’t load suggestions. Try a downloaded city.”* + list of downloaded cities.
- **No “Retry” in the main flow** unless we add an explicit “Refresh” control; we prefer “choose a downloaded city” to avoid repeated slow requests.

---

## State 3: No Pack Downloaded Yet

**When:** User has selected a city **and** `getTier1Pack(city)` is **null**. Connectivity can be `online`, `poor`, or `offline`.

### What the user sees

- **City input:** City name is shown (from selection). No pack card below.
- **Main block (replaces pack card):** A single, focused card. Content depends on connectivity.

#### 3a) Online or Poor

- **Heading:** *“Download [City] for offline”*
- **Body:**  
  - *“Get the essentials: food, transport, safety, and more. Works without the internet.”*
- **Primary button:** *“Download pack”* (or “Download for offline”). Triggers fetch + `storePackLocally`. While fetching → see **State 4: Pack downloading**.
- **Optional:** *“Takes a few seconds. You only need to do this once.”*

#### 3b) Offline

- **Heading:** *“Download [City] when you’re online”*
- **Body:**  
  - *“This city isn’t saved yet. Connect to Wi‑Fi or mobile data, then download the pack. It will work offline after that.”*
- **Secondary / link:** *“Choose a downloaded city”* → show `getTier1Packs()` (e.g. chips). Tapping one switches city to that and, if cached, shows the pack (Fully Offline).
- **No primary “Download”** — disabled or hidden. Copy: *“Download not available offline.”*

### Actions allowed

- **Online / Poor:** Tap “Download pack” → start download (State 4). Change city (input or back).
- **Offline:** Change city to a **downloaded** one. No download.

### Messaging

- **Online:**  
  - *“Download [City] for offline”*  
  - *“Get the essentials: food, transport, safety, and more. Works without the internet.”*  
  - *“Download pack”*
- **Offline:**  
  - *“Download [City] when you’re online”*  
  - *“This city isn’t saved yet. Connect to Wi‑Fi or mobile data, then download the pack.”*  
  - *“Choose a downloaded city”*

---

## State 4: Pack Downloading

**When:** User triggered a pack fetch for the current city **and** `isLoading === true` (or equivalent). Network is `online` or `poor`.

### What the user sees

- **City input:** City name remains. Disabled or read‑only during download (optional).
- **Pack area:** Replaces the “No pack” or the full pack UI with a **downloading** card.
- **Layout:**
  - **Heading:** *“Downloading [City]…”*
  - **Subtitle:** *“Preparing your offline pack.”*
  - **Progress:**  
    - **Preferred:** Indeterminate spinner or a small skeleton (cards outline). No fake % if we don’t have real progress.  
    - **Optional:** “Step 1 of 1” or “Almost there…” if we have a single fetch.
  - **No “Cancel”** in the first version (we can add later). Back / change city is allowed: we cancel in-flight fetch and clean up.

### Actions allowed

- **Back / change city:** Allowed. We abort the fetch, clear `isLoading`, and show “No pack” or another city’s state.
- **No:** Opening search, cards, or voice until download finishes.

### Messaging

- *“Downloading [City]…”*
- *“Preparing your offline pack.”*
- **On error (fetch failed):**  
  - *“Download didn’t finish. Check your connection and try again.”*  
  - **Primary:** *“Try again”* (re‑trigger fetch).  
  - **Secondary:** *“Choose a downloaded city”* (if any).

---

## State 5: Pack Update Available

**When:** Pack for the current city is **cached** **and** connectivity is **online** (or `poor` but we still attempt) **and** the app has determined a **newer version** exists (e.g. from background fetch, ETag, `version` or `updatedAt` in the API, or periodic check).

### What the user sees

- **Pack header:** Same as usual: city, “Offline-ready”, “Tier 1 Available”, Offline Search, cards, etc. **We do not hide or degrade the current pack.**
- **Update affordance (clearly secondary, non‑blocking):**
  - **Placement:** In the pack header, e.g. next to “Tier 1 Available”, or in a thin bar under the header.
  - **Form:**  
    - **Option A:** *“Update available”* with an “Update” button.  
    - **Option B:** *“New version of this pack — Update”* (link or button).  
  - **Style:** Muted (e.g. `--text-on-dark-muted`), or a soft accent. Not error, not a full-width banner. Dismissible (X) or it hides after the user taps “Update” and the update finishes.
- **Rest of the pack:** Unchanged. Search, cards, voice, Download all work. User can ignore the update.

### Actions allowed

- **Update:** Tap “Update” → we fetch the latest pack, then `storePackLocally`, then refresh the pack in memory. During fetch: show a small inline state, e.g. *“Updating…”* next to the button; we **do not** replace the pack with a loading skeleton. On success: *“Updated”* (brief, 2–3s) and hide the affordance. On failure: *“Update failed. Try again.”* with “Try again”.
- **Dismiss (optional):** Hiding the “Update available” for this session. It can reappear on next visit or when we再次 detect an update.
- **Use pack as-is:** All normal actions. No blocking.

### Messaging

- **Default:** *“Update available”* + *“Update”*
- **While updating:** *“Updating…”*
- **Success:** *“Updated”* (toast or inline, brief).
- **Failure:** *“Update failed. Try again.”* + *“Try again”*

---

## State Matrix (Connectivity × Pack)

| Connectivity | Pack state        | UX state              |
|-------------|-------------------|------------------------|
| offline     | cached            | **1. Fully offline**   |
| offline     | none              | **3. No pack (offline)** |
| poor        | cached            | **2. Weak network**    |
| poor        | none              | **3. No pack** or **4. Pack downloading** if fetch in progress |
| poor        | downloading       | **4. Pack downloading** |
| online      | none              | **3. No pack** or **4. Pack downloading** |
| online      | downloading       | **4. Pack downloading** |
| online      | cached            | Normal (or **5. Pack update available** if we know there’s an update) |
| online      | update_available  | **5. Pack update available** |

---

## Component-Level Summary

| Component         | 1. Fully offline   | 2. Weak network      | 3. No pack (offline) | 3. No pack (online) | 4. Downloading | 5. Update available |
|------------------|--------------------|----------------------|-----------------------|----------------------|----------------|----------------------|
| **City input**   | Downloaded list    | Autocomplete + note  | —                     | —                    | Read‑only opt. | Normal               |
| **Autocomplete** | Hidden             | Shown, “may be slow” | N/A                   | Shown                | N/A            | Shown                |
| **Pack card**    | Full               | Full (if cached)     | “Download when online”| “Download pack”      | “Downloading…” | Full + update strip  |
| **Offline Search** | Shown            | Shown (if cached)    | Hidden                | Hidden               | Hidden         | Shown                |
| **Voice**        | Shown              | Shown (if cached)    | Hidden                | Hidden               | Hidden         | Shown                |
| **Problem cards**| Shown              | Shown (if cached)    | Hidden                | Hidden               | Hidden         | Shown                |
| **Download btn** | “Already saved”/hide| Shown               | “Choose downloaded”   | “Download pack”      | —              | Shown                |
| **Tier 2–4**     | Hidden / 1 line    | Hidden / 1 line      | Hidden                | Hidden               | Hidden         | Per existing rules   |
| **Global banner**| None               | “Connection slow…”   | None                  | None                 | None           | None                 |

---

## Copy Cheat Sheet

| State        | Key strings |
|-------------|-------------|
| **1. Fully offline** | *“Offline: choose a downloaded city”*, *“Using your saved copy”*, *“No cities downloaded yet. Add one when you’re back online.”* |
| **2. Weak network**  | *“Connection is slow. Using your saved data.”*, *“Connection is slow. Some features may be unavailable.”*, *“Couldn’t load suggestions. Try a downloaded city.”* |
| **3. No pack (on)**  | *“Download [City] for offline”*, *“Get the essentials: food, transport, safety, and more. Works without the internet.”*, *“Download pack”* |
| **3. No pack (off)** | *“Download [City] when you’re online”*, *“This city isn’t saved yet. Connect to Wi‑Fi or mobile data, then download the pack.”*, *“Choose a downloaded city”* |
| **4. Downloading**   | *“Downloading [City]…”*, *“Preparing your offline pack.”*, *“Download didn’t finish. Check your connection and try again.”*, *“Try again”* |
| **5. Update**        | *“Update available”*, *“Update”*, *“Updating…”*, *“Updated”*, *“Update failed. Try again.”* |

---

## Principles

1. **Offline = default, not error.** No “You’re offline” full-screen. We reduce (autocomplete, Tier 2–4) and guide (“choose a downloaded city”).
2. **One major message per state.** No stacking of “You’re offline” + “No pack” + “Weak network.” Pick the dominant state and message.
3. **Actions stay possible.** In “No pack (offline),” we always offer “Choose a downloaded city.” In “Update available,” we never block using the current pack.
4. **Download/update are secondary.** Pack content and navigation are primary; “Download” and “Update” are clear but not dominant.
5. **Consistent chrome.** Header, city block, back/home, and card layout stay in place. We swap only the **inner** content (e.g. “No pack” vs full pack vs “Downloading…”).
