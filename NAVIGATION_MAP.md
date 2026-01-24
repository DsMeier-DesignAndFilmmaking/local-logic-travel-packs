# Navigation Map — Offline-First Travel Packs

## 1. Screen Stack (depth)

```
[0] Home           — City input; pack list or "pick a city"
[1] Pack           — Tier header, Search, Problem cards (headline cards)
[2] MicroSituations — List for one card
[3] Actions        — Action list + What to do instead for one microSituation
```

- **Depth 0–3 only.** No extra levels; no tier2/3/4 as additional stack levels (they live inside Pack as sections or modals, not in the main stack).
- **Search result** → Opens Actions (or MicroSituations) for the matched card/microSituation. Treated as a jump into the stack at [2] or [3]; stack is rebuilt so Back is valid (see 3.1).

---

## 2. Navigation Stack (in-memory)

- **Model:** Array of entries. Each entry = `{ screen, context }`.
- **Stored in:** Component state or a small store (e.g. React state, Zustand). **Not in the URL.**
- **No `history.pushState` / `replaceState` for the pack flow.** The pack → card → microSituation → actions path does not sync to `location.pathname` or `location.search`. That keeps navigation fully offline and avoids routes that would need network to resolve (e.g. `/paris/card/3`).

**Stack entry shape (minimal):**

```
{ screen: 'home' | 'pack' | 'microSituations' | 'actions',
  context: {
    city?: string,           // pack, microSituations, actions
    tierKey?: 'tier1' | …,   // pack, microSituations, actions
    cardIndex?: number,      // microSituations, actions
    microIndex?: number      // actions
  }
}
```

- **home:** `context` empty or `{ city }` if returning from a pack.
- **pack:** `{ city, tierKey: 'tier1' }`. `cardIndex` / `microIndex` are undefined.
- **microSituations:** `{ city, tierKey, cardIndex }`. `microIndex` undefined.
- **actions:** `{ city, tierKey, cardIndex, microIndex }`.

All `context` comes from the in-memory pack (e.g. `getTier1Pack(city)`). No IDs resolved from a server.

---

## 3. Back Behavior

### 3.1 Rules

| At screen     | Back (←) does                    |
|---------------|----------------------------------|
| **Pack**      | Go to Home. Pop to [0].          |
| **MicroSituations** | Go to Pack. Pop to [1].   |
| **Actions**   | Go to MicroSituations. Pop to [2]. |

- **Back = pop one from the in-memory stack.** No `history.back()` for the pack flow; we do not rely on the browser history for card → microSituation → actions.
- **Hardware Back (Android, some browsers):** Either (a) treat as our Back and pop the stack, or (b) `history.back()` only for [0]→exit; for [1]–[3] intercept and run our pop. Pick one and keep it consistent. Recommendation: intercept for [1]–[3] and always pop; only at [0] use `history.back()` toward a parent app or previous site.

### 3.2 Edge cases

- **Stack length 1 (only Pack):** Back → Home; stack becomes `[Home]` or `[]` then navigate to Home.
- **Search jump to Actions:** Stack is rebuilt so it’s `[Pack, MicroSituations, Actions]` (or `[Pack, Actions]` if we allow a shorthand). Back from Actions must never be empty; it goes to MicroSituations or Pack.
- **Search jump to MicroSituations:** Stack = `[Pack, MicroSituations]`. Back → Pack.

---

## 4. Breadcrumb Logic

### 4.1 Segment labels (from local data only)

| Segment      | Source                          | Example                |
|--------------|----------------------------------|------------------------|
| City         | `pack.city`                      | "Paris"                |
| Tier         | `tier.title`                     | "Immediate need"       |
| Card         | `card.headline`                  | "I'm lost / Getting around" |
| MicroSituation | `microSituation.title`        | "I'm lost"             |
| Actions      | Literal                          | "What to do"           |

- **No slugs, no IDs in the breadcrumb.** Labels come only from the already-loaded pack. Nothing is looked up by ID over the network.

### 4.2 Breadcrumb by screen

| Screen         | Breadcrumb (left → right)              |
|----------------|----------------------------------------|
| **Pack**       | `City`                                 |
| **MicroSituations** | `City › Card` or `City › Card (truncated)` |
| **Actions**    | `City › Card › MicroSituation`          |

- **Separator:** `›` or `·` or `/`. Pick one.
- **Truncation:** If `Card` or `MicroSituation` is long, truncate with `…` at ~20–30ch. Full string on hover/focus only if needed; no extra network.

### 4.3 Taps on breadcrumb

- **City** → Pack (or Home if Pack is [1] and we consider City = “back to pack”).
- **Card** → MicroSituations for that card. Rebuild stack: `[Pack, MicroSituations]` with `cardIndex` for that card.
- **MicroSituation** → Actions for that microSituation. Rebuild stack: `[Pack, MicroSituations, Actions]` with `cardIndex` and `microIndex`.

- **Implementation:** Breadcrumb taps **replace** the stack from that segment down (pop to that level, then push the tapped segment). They do not create forks that require the network.

### 4.4 When to show

- **Pack:** Breadcrumb optional (City only or omitted).
- **MicroSituations, Actions:** Breadcrumb recommended so users see path and can jump back to Card or Pack. Can live in the same row as Back/Home or directly under.

---

## 5. Offline-Safe Transitions

### 5.1 What “offline-safe” means

- **No XHR/fetch during a transition.** The next screen is rendered from data already in memory (e.g. `getTier1Pack(city)`, or a `pack` in state). No “loading the page” or “resolving the route” over the network.
- **No routing that depends on the network:** e.g. no `/pack/:city` that hits an API to validate `:city` or load the pack. Pack and `context` are from localStorage or in-memory cache only.

### 5.2 Allowed techniques

- **Push/pop the in-memory stack** and re-render the top. No `window.location` change for the pack flow.
- **CSS only:** `opacity`, `transform` (e.g. `translateX`/`translateY`). Duration ~200–250ms, `ease-out`. No `requestAnimationFrame` loops that depend on loading assets.
- **Instant swap:** If CSS transitions are disabled or `prefers-reduced-motion: reduce`, an immediate view swap is fine.

### 5.3 Direction

- **Forward (deeper):** e.g. new content from the right: `translateX(20px)→0` and fade in; previous view can stay or fade out. Optional.
- **Back (pop):** e.g. current view `translateX(0)→20px)` and fade out; previous view fades in. Optional.
- **Simpler:** Both directions use a short cross-dissolve (~150–200ms). No requirement for directional animation.

### 5.4 What to avoid

- **No history.pushState for pack/card/micro/actions.** If we ever add URLs, they must be derived from the in-memory stack after render, not the other way around. No route like `/city/card/:id` that triggers a fetch to resolve `:id`.
- **No “skeleton” or “loading” for the next screen in the pack flow.** The next view is already in memory; we only swap. Loading states are only for network-backed steps (e.g. city fetch, pack fetch when not cached).

---

## 6. Navigation Map (visual)

```
                    [0] HOME
                        │
                        │ select city (pack in cache or fetched once)
                        ▼
                    [1] PACK
                   /    │    \
                  /     │     \___ Search → can jump to [2] or [3]
                 /      │          (stack rebuilt so Back works)
                /       │
     Back      /        │ tap headline card
       ───────         ▼
                 [2] MICROSITUATIONS
                      /    │
                     /     │ tap microSituation
      Back          /      ▼
        ─────────  [3] ACTIONS
                       (read-only; Back → [2])

Breadcrumb:
  [1] Pack              →  City
  [2] MicroSituations   →  City › Card
  [3] Actions           →  City › Card › MicroSituation
```

---

## 7. Out of scope (by design)

- **Deep links into pack/card/micro/actions.** We do not support `/pack/paris/card/2/micro/1` or similar. Those would require (a) a server or (b) storing enough in the URL to rehydrate from cache, which adds failure modes offline. Excluded.
- **URL as source of truth for the stack.** The stack is the source of truth; URL is not used for the pack flow.
- **Tier 2/3/4 in the main stack.** They are optional; if present, they live as sections on Pack or in a separate, gated flow. They do not add 4–6 to the stack depth for the core offline path.

---

## 8. Short Reference

| What            | Rule                                                                 |
|-----------------|----------------------------------------------------------------------|
| **Stack**       | In-memory only. `[home \| pack \| microSituations \| actions]` + `context`. |
| **Back**        | Pop one. Pack→Home, MicroSituations→Pack, Actions→MicroSituations.   |
| **Breadcrumb**  | City › Card › MicroSituation from local data; taps = rebuild stack to that level. |
| **Transitions** | CSS only, ~200ms; or instant. No fetch during transition.            |
| **URL**         | Not used for pack/card/micro/actions. No deep links into the pack.   |
