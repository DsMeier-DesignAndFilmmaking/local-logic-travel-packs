# Offline Search + Voice Spec

**Goal:** Match human language → situations, not keywords → places. Return microSituations as the unit of result.

---

## 1. Matching Order

Evaluated together; **scoring** reflects priority (higher = tried “first” in spirit):

1. **Situational phrase** — Query concepts overlap headline/title concepts (e.g. "hungry" → food, "I'm lost" → lost). +50.
2. **Headline / microSituation title** — Phrase-in-order, exact token, or fuzzy token match in the situation (headline, microSituation title). +30–40.
3. **Action / whatToDoInstead** — Exact or fuzzy in actions and advice. +18–20 per hit.
4. **searchableText** — Fallback substring of the full normalized query. +5.

---

## 2. Scoring Rules

| Match type | Points |
|------------|--------|
| Situational overlap (query-concept ∩ item-concept) | +50 once per item |
| Phrase in order (headline or title) | +40 |
| Exact token in headline | +35 |
| Exact token in microSituation title | +30 |
| Fuzzy token matches in headline+title | +8 per matching query token, cap ~+24 |
| Exact token in an action | +20 per matching action |
| Exact token in whatToDoInstead | +18 |
| Fuzzy in action/advice | +4 per matching token, cap ~+12 |
| searchableText contains full query | +5 |
| Additional matching query tokens (beyond first) | +5 each, cap +15 |

**Cap total at 100.**

- **Strong match threshold:** 25. If the best score &lt; 25, we treat as “no strong match” and return **fallback**.

---

## 3. Fallback When No Strong Match

- **When:** Best score &lt; `STRONG_MATCH_THRESHOLD` (25) or 0 results.
- **What:** 2–3 **microSituations** (full: title, actions, whatToDoInstead), chosen for:
  - **Broad usefulness:** food, transport, safety, things to do, rest, toilet, etc.
  - **Not time-sensitive:** deprioritize “late night”, “2am”, “early morning”, etc.
  - First action in a micro often gets a small boost.
- **Shape:** Same `MicroSituationMatch` as normal results, with `matchType: 'fallback'`, `relevanceScore: 0`, `matchedActions: []`.
- **UI:** Show a message like “Showing useful situations from your downloaded pack” so the user knows these are suggestions, not query hits.

---

## 4. Lightweight Fuzzy Matching

- **No Levenshtein, no FTS library.** For voice and short queries:
  - **Substring / contains:** `content.toLowerCase().includes(token)`.
  - **Token-level:** `fuzzyTokenMatch(a,b)` = `a===b` or `a.includes(b)` or `b.includes(a)`.
  - **Phrase:** All query tokens appear in content in order (gaps allowed), or each token has at least one fuzzy match in the content words.

---

## 5. Emotional / Situational Phrases

- **Query → concept:** e.g. hungry, eat, food, restaurant → `food`; lost, direction, metro, transport → `lost`; safe, scam, suspicious → `safety`; tired, rest, overwhelm → `tired`; phrase, language, order → `language`; toilet, bathroom → `toilet`; etc.
- **Headline/title → concept:** Same concept keys; we infer from words in the card headline and microSituation title.
- **Overlap:** If `queryConcepts ∩ itemConcepts` is non‑empty → situational match and +50.

---

## 6. Return Type: microSituations

- **Unit:** One `MicroSituationMatch` per microSituation (not per action).
- **Fields:** `cardHeadline`, `microSituation: { title, actions, whatToDoInstead }`, `matchedActions: string[]`, `city`, `relevanceScore`, `matchType`.
- **Preview in UI:** Use `matchedActions[0] || microSituation.actions[0]` as the snippet. `onResultClick` receives the full `MicroSituationMatch` so the parent can open `MicroSituationView` with `microSituation`.

---

## 7. Files

| File | Role |
|------|------|
| `src/lib/situationalPhrases.ts` | Query/content → concepts; overlap check. |
| `src/lib/fuzzyMatch.ts` | `fuzzyTokenMatch`, `countTokenMatches`, `phraseContainsInOrder`, `containsSubstring`. |
| `src/lib/offlineSearchIndex.ts` | `buildOfflineSearchIndex` — one `OfflineSearchIndexItem` per microSituation. |
| `src/lib/offlineSituationalSearch.ts` | `searchSituational`, scoring, fallback (`getFallbackMicroSituations`), `STRONG_MATCH_THRESHOLD`. |
| `src/lib/offlineSearch.ts` | `searchOffline`: travel-signal guard, `getTier1Pack`, `searchSituational`; tags fallback as `TravelSignalFallbackResult` when `matchType==='fallback'`. |
| `src/components/OfflineSearch.tsx` | Renders `MicroSituationMatch[]`; preview = `matchedActions[0] \|\| microSituation.actions[0]`; `onResultClick(MicroSituationMatch)`. |
