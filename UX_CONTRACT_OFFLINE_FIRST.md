# UX Contract: Offline-First Travel Packs

## Purpose

This contract defines how the product must behave so that **online and offline experiences are the same** for navigation, interactions, layout, and content structure. It is the single source of truth for design and implementation decisions that affect both modes.

---

## 1. Core UX Principles

### 1.1 One experience, two data sources

- **Online and offline must present the same UI and flow.** The user cannot infer connectivity from layout, navigation, or interaction patterns.
- **Only the data source may differ** (network vs localStorage). The shell, hierarchy, and affordances stay identical.
- **Offline is the design baseline.** Every screen and interaction must be specified to work without a network. Online-only behavior is the exception and must be explicitly called out.

### 1.2 Problem-first, not place-first

- Content is structured as **problems and situations**, not as a generic list of tips.
- The user always answers: *What do I need right now?* before seeing *What should I do?*
- This order (Problem → Situation → Actions) is invariant online and offline.

### 1.3 Downloaded pack as source of truth

- **Tier 1 is the canonical offline surface.** Anything shown in the core flow (cards → microSituations → actions) comes from the downloaded pack.
- Online features may **enhance** (e.g. search ranking, voice) but must not **replace** or **remove** Tier 1 content when offline.
- If Tier 1 exists in the pack, it is always rendered the same way, regardless of connectivity.

### 1.4 Graceful reduction, not degradation

- When offline, we **reduce** (e.g. hide city autocomplete, gate premium tiers) rather than **degrade** (broken layouts, missing nav, different content hierarchy).
- Reduced states must feel intentional: same chrome, same structure, with clear boundaries for what is available.

---

## 2. Navigation Rules

### 2.1 Global navigation (identical online and offline)

| Route / state           | Online | Offline | Rule |
|-------------------------|--------|---------|------|
| Home → City input       | ✓      | ✓       | Same input; autocomplete may be absent offline. |
| City selected → Pack    | ✓      | ✓*      | \*Only if pack was previously downloaded. |
| Pack → Problem cards    | ✓      | ✓       | **Invariant.** Same entry point. |
| Card → MicroSituations  | ✓      | ✓       | **Invariant.** Same list and order. |
| MicroSituation → Actions| ✓      | ✓       | **Invariant.** Same view and back/home. |

### 2.2 Back and Home

- **Back** (←): One step up in the hierarchy (MicroSituation → Card, or Card → Problem list).
- **Home / All Problems**: Direct return to the Problem cards list for the pack.
- Both controls are always visible and work the same online and offline. No connectivity-dependent disabling.

### 2.3 Hierarchy depth (fixed)

```
[Home / City select]
       ↓
[Pack header: city, Tier 1 badge, Download, Offline Search]
       ↓
[Problem cards]  ← "What do you need right now?"
       ↓
[MicroSituations for card]  ← "Choose a situation"
       ↓
[MicroSituation view: Actions + What to do instead]
```

- This depth and order **do not change** with connectivity. We do not add or remove levels when offline.

### 2.4 Search as parallel entry

- **Offline Search** is a sibling to Problem-first navigation, not a replacement.
- It uses the same Tier 1 data and leads to the same content (card / microSituation / action). Tapping a search result should, where possible, align with the same structure (e.g. open the corresponding MicroSituation view or at least the same actions).
- Search UI (input, voice, results list, fallbacks) is identical online and offline; only the underlying index is local.

---

## 3. Content Hierarchy

### 3.1 Data model (problem-first JSON)

```
TravelPack
├── city, country
└── tiers
    ├── tier1 { title, cards[] }     ← Required for offline; same structure online/offline
    ├── tier2? { title, cards[] }    ← Optional; may be gated or unavailable offline
    ├── tier3? { title, cards[] }    ← Optional; may be gated or unavailable offline
    └── tier4? { … }                 ← Optional; e.g. Spontaneity; may be gated offline

ProblemCard (tier.cards[])
├── headline
├── icon? (optional)
└── microSituations[]

MicroSituation
├── title
├── actions[]           ← Ordered list; same order online and offline
└── whatToDoInstead?    ← Optional; if present, same placement and styling
```

### 3.2 Presentation hierarchy (invariant)

| Level           | Role                     | Presentation rule |
|-----------------|--------------------------|-------------------|
| **Tier**        | Section (e.g. "Immediate Need") | Same heading and order when the tier is available. |
| **Card**        | Problem                   | Headline + count of microSituations. Same size, spacing, and tap target. |
| **MicroSituation** | Situation              | Title + count of actions. Same list layout and tap target. |
| **Action**      | Concrete step             | Numbered item; same typography and accent (e.g. green left border). |
| **What to do instead** | Advice              | If present: same block (e.g. amber, 💡). Omitted only when the field is empty. |

- **Ordering:** `cards` and `microSituations` and `actions` are displayed in array order. We do not reorder or filter for connectivity.

### 3.3 Tier availability

- **Tier 1:** Always shown when the pack has `tiers.tier1`. Same sections (Offline Search, Problem-first navigation, Tier 1 badge, Download) online and offline.
- **Tier 2–4:** May be hidden or gated offline. If shown, their **structure** (title, cards, microSituations, actions) matches the online schema. We only change **visibility or access**, not hierarchy or layout.

---

## 4. Layout Rules

### 4.1 Viewport and shell

- **Web viewport first.** Layout is built for typical browser viewports; then adapted for small/large and touch.
- **Shell is fixed:** header/hero, city input, pack container. These sections and their order do not depend on connectivity.
- **Pack container:** Same max-width, padding, and background (e.g. dark blue header) online and offline.

### 4.2 Touch and interaction targets

- **Minimum tap height:** 44px for controls and list rows.
- **Cards:** Minimum height for problem cards (e.g. 140px) and microSituation buttons (e.g. 80px) so they remain tappable and visually stable offline.
- **`touch-action: manipulation`** (or equivalent) on interactive elements to reduce delay. Same online and offline.

### 4.3 Theming and emphasis

- **CSS variables** (e.g. `--text-primary`, `--accent-green`, `--text-on-dark`) define colours. The same variables are used online and offline; we do not switch to a “degraded” palette when offline.
- **Accents:** e.g. green for primary actions and left borders on action items. Same usage in both modes.

### 4.4 Responsiveness

- Breakpoints and stacking (e.g. grid → single column) are defined by viewport, not by connectivity.
- When a section is hidden offline (e.g. city autocomplete), we collapse or hide it; we do not change the layout of the rest of the page.

---

## 5. Offline Constraints to Respect

### 5.1 Must work fully offline (once a pack is downloaded)

- **Tier 1:** Cards, microSituations, actions, and What to do instead must render and be navigable without network.
- **Offline Search:** Query, tokenisation, travel-signal guard, and result/fallback list must run on the cached Tier 1 payload only.
- **Voice input:** Uses on-device speech recognition; no cloud dependency. Same button, same placement, same feedback.
- **Back / Home:** Implemented with local state or in-memory history; no server round-trips.

### 5.2 Allowed to differ offline

- **City autocomplete:** Depends on network. Offline: no suggestions; user can still type and select a city if it was previously chosen and the pack is cached.
- **Fetching a new pack:** Requires network. Offline: only already-downloaded cities/packs are usable.
- **Tier 2–4 and premium / Spontaneity:** May require network or entitlements. Offline: these sections can be hidden or show a “download when online” style message. The **layout** of the rest of the page stays the same.

### 5.3 Must never do when offline

- **Change navigation depth or order** (e.g. add or remove a level, or reorder Problem → Situation → Actions).
- **Use a different content structure** for Tier 1 (e.g. flatten cards and microSituations, or drop `whatToDoInstead`).
- **Show a different layout** for the same Tier 1 screen (e.g. reduced card size, different back/home position).
- **Replace or remove Tier 1 content** with an online-only alternative (e.g. “better” search that only works online).
- **Hide or disable Back / Home** because of connectivity.
- **Break or hide Offline Search**; it must remain available and usable with the cached pack.

### 5.4 Loading and errors

- **Loading states:** Used when fetching (e.g. city suggestions, pack). Offline, we avoid entering those flows for network-dependent features; we do not show a “loading forever” state for Tier 1.
- **Errors:** Network errors must not alter layout or navigation. We use inline or modal messages, and keep the same chrome and hierarchy. Offline, we do not replace the Tier 1 UI with a generic “offline” or “error” layout.

---

## 6. Summary Checklist

Use this when changing UI or data flow:

- [ ] **Navigation:** Same steps and depth online and offline for Tier 1 (cards → microSituations → actions)? Back/Home unchanged?
- [ ] **Interactions:** Same tap targets, buttons, and behaviour? No connectivity-based enabling/disabling of core nav or search?
- [ ] **Layout:** Same shell, sections, and order? Same breakpoints and touch minima? No “offline-only” or “online-only” layout variants for Tier 1?
- [ ] **Content structure:** Same JSON shape used for Tier 1? Same order of cards, microSituations, actions? `whatToDoInstead` shown when present?
- [ ] **Offline constraints:** No new network-dependent step in the core path? No removal or replacement of Tier 1 when offline? Search and voice still work from cached data?

---

## 7. Document meta

- **Scope:** Travel Packs; problem-first structure (tiers → cards → microSituations); web viewport first.
- **Principle:** Same navigation, interactions, layout, and content structure online and offline. Offline is the baseline; online adds data or features without changing the core UX.
