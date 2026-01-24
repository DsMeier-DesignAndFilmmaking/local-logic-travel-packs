# JSON Structure Evaluation for Offline UX

## Structure (as-is)

```
TravelPack
├── city, country
└── tiers
    ├── tier1: { title, cards[] }    (required for offline)
    ├── tier2?, tier3?, tier4?:      (optional, same shape)
    └──

ProblemCard (in tier.cards[])
├── headline
├── icon?        (optional)
└── microSituations[]

MicroSituation (in card.microSituations[])
├── title
├── actions[]         (strings)
└── whatToDoInstead?  (optional string)
```

**No restructuring.** Only evaluation and optional additive fields where necessary.

---

## 1. Does each level map cleanly to UI screens?

| JSON level       | UI screen / block              | Map | Notes |
|------------------|--------------------------------|-----|-------|
| **tiers**        | Pack section; tier as heading  | ✓   | `tier.title` (e.g. "Immediate Need") can be the H2 above the cards. If only tier1 is shown, one section. |
| **cards**        | Problem cards (Level 1)        | ✓   | One card = one row. `headline` = primary label, `microSituations.length` = optional meta. |
| **microSituations** | MicroSituation list (Level 2) | ✓   | One micro = one row. `title` = label, `actions.length` = optional meta. |
| **actions**      | Actions list (Level 3)         | ✓   | `actions[]` = numbered list. Order = display order. |
| **whatToDoInstead** | One block under actions      | ✓   | Optional; only rendered when present. |

**Verdict:** Yes. The hierarchy matches the three content levels (cards → microSituations → actions) and the pack/tier as section. One gap: **`tier.title`** is underused in the current UI (e.g. as the H2 above the Problem cards). Consider surfacing it; no JSON change.

---

## 2. Are there missing UX-critical fields?

### 2.1 Must have (already present)

- **Pack:** `city`, `country` — for header, search, breadcrumb. ✓
- **Tier:** `title` — for section heading. ✓
- **Card:** `headline` — for card label, search, breadcrumb, dedup. ✓
- **MicroSituation:** `title`, `actions` — for list label, search, actions list, dedup. ✓
- **MicroSituation:** `whatToDoInstead?` — for advice block. ✓ Optional is correct.

Nothing required is missing.

### 2.2 Optional additive (only if needed)

| Field   | Where           | Purpose | When to add |
|---------|-----------------|---------|-------------|
| **`id`** | `ProblemCard`   | Stable id for “open this card” from search, and for safe reordering of `cards[]`. | If you allow duplicate `headline` across cards, or if you reorder cards and need to stay stable across cache updates. |
| **`id`** | `MicroSituation`| Stable id for “open this micro” from search, and for safe reordering of `microSituations[]`. | If you allow duplicate `title` within a card, or reorder microSituations. |

**Suggestion:** Keep JSON as-is. Add `id` only if you hit:

- Duplicate `headline` or duplicate `title` (within a card), or  
- Reordering of `cards`/`microSituations` where array index can change between cache and a later pack version.

If you add:

- `card.id`: string, unique within the pack (or at least within the tier).
- `microSituation.id`: string, unique within the card.

The app can then resolve “open from search” and navigation by `id` instead of by `headline`/`title` or index. **Do not add** unless one of the above is a real problem.

### 2.3 Not required

- **`icon` on card:** Already optional. Often redundant with emoji in `headline`. No change.
- **`order` / `position`:** Array order defines order. No extra field.
- **`timeOfDay` / `neighborhood` on card or micro:** Used for search/ranking today via inference from text. Optional `timeOfDay?: string[]` or `neighborhood?: string` would improve relevance only if inference is insufficient. Omit for now.
- **`lang` on pack:** One language per pack is enough for current offline use. Omit.

---

## 3. Content ambiguity for offline use?

### 3.1 Duplicate `headline` or `title`

- **Dedup in search:** Keys use `card.headline | micro.title | action`. Duplicate `headline` across cards or duplicate `title` within a card can still produce unique keys as long as `action` differs. For **navigating from search to the Actions view**, the app does `card.headline === result.cardHeadline` and `micro.title === result.microSituationTitle`. The **first** match is used.
- **Risk:** Two cards with the same `headline`, or two microSituations with the same `title` in one card, can make “open from search” target the wrong one. In current packs (e.g. Paris, NYC) headlines and titles are effectively unique.
- **Mitigation:** Keep headlines/titles unique when authoring. If you can’t, add `id` on card and microSituation and resolve by `id`.

### 3.2 Empty arrays

- **`cards: []`** — Tier has no cards. UI can hide the tier or show “No problems for this tier.” No schema change.
- **`microSituations: []`** — Card has no situations. UI can hide the card or show “No situations.” No schema change.
- **`actions: []`** — Micro has no actions. UI shows “What to do:” and an empty list. Unusual but valid. No schema change.

All are representable and renderable. No extra fields.

### 3.3 Missing `whatToDoInstead`

- Optional; many microSituations (e.g. “Surprise Me”) omit it. UI correctly shows the block only when present. No ambiguity.

### 3.4 Navigation and indices

- **In-app nav:** Uses `cardIndex` and `microIndex` (array indices). Stable as long as the cached JSON’s `cards` and `microSituations` order does not change. If you ever reorder and the user has an old cache, indices can point to the wrong card/micro. Optional `id` plus resolving by `id` would avoid that. Not required for the current “no reorder” / “replace whole pack” model.

### 3.5 Search → “open MicroSituation / Actions”

- **Input:** `cardHeadline`, `microSituationTitle`, `action` from the search result.
- **Logic:** Find `card` with `card.headline === cardHeadline`, then `micro` with `micro.title === microSituationTitle`. Open Actions for that `(card, micro)`. Works with the existing schema as long as that pair is unique. Duplicates make it ambiguous; `id` would resolve it.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| **1. Map to UI?** | Yes. tiers → section; cards → L1; microSituations → L2; actions + whatToDoInstead → L3. Only note: use `tier.title` as section heading. |
| **2. Missing UX‑critical?** | No. Optional **`id`** on `ProblemCard` and `MicroSituation` only if you need: duplicate headlines/titles, or reordering without index drift. |
| **3. Content ambiguity?** | Low. Main risks: duplicate headline/title (mitigate by authoring or optional `id`), and empty `actions[]` (handle in UI). |

---

## 5. Do-not-change list

- Keep `tiers`, `cards`, `microSituations`, `actions`, `whatToDoInstead` as they are.
- Keep `city`, `country` at pack root; `title` on tier; `headline` (and optional `icon`) on card; `title`, `actions`, optional `whatToDoInstead` on microSituation.
- Do not introduce required fields. Only optional `id` is suggested, and only if the conditions in §2.2 apply.
