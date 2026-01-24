# Offline Voice Match Flow

**Assumptions:** Voice → text first (STT). No cloud NLP. All matching is local.

**Hierarchy:** 1) Card headlines → 2) MicroSituation titles → 3) Action keywords → 4) Tier-level fallback.

---

## 1. Matching Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VOICE TEXT (e.g. "I'm hungry", "I feel unsafe")                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  NORMALIZE                                                                   │
│  • Lowercase, trim                                                           │
│  • extractQueryTokens: drop stop-words (I, the, can, …), length > 1          │
│  • Keep phrase: optional "I'm X" / "I feel X" → concept for headlines        │
│  → tokens: string[]   e.g. ["hungry"]   ["feel","unsafe"]                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1 — CARD HEADLINES                                                     │
│  • Map tokens + concepts → headlines (VOICE_TO_HEADLINE)                     │
│  • Match: token or concept in HEADLINE_KEYWORDS[headline]                    │
│  • If ≥1 match → scope = those cards.  If 0 → scope = full tier.             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │  headlines matched?                   │
                    │  YES: cards = matched cards           │
                    │  NO:  cards = all tier cards          │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2 — MICROSITUATION TITLES                                              │
│  • Within scope (cards from step 1), match tokens → microSituation titles    │
│  • VOICE_TO_MICRO: token/concept → micro title keywords                     │
│  • If ≥1 match → micros = those.  If 0 → micros = all in scope (or first).   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │  micros matched?                      │
                    │  YES: use those microSituations       │
                    │  NO:  use first / all in each card    │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3 — ACTION KEYWORDS                                                    │
│  • Within scope (cards + micros from 1–2), match tokens to action text       │
│  • substring or fuzzy token in actions (and whatToDoInstead)                 │
│  • If ≥1 → return those actions as matchedActions.  If 0 → return all        │
│  • OUTPUT: (card, microSituation, matchedActions) → MicroSituationMatch[]    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │  any (card,micro) from 1–3?           │
                    │  YES → return MicroSituationMatch[]   │
                    │  NO  → STEP 4                         │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4 — TIER-LEVEL FALLBACK                                                │
│  • Return tier title + 2–3 suggested cards or microSituations                │
│  • Pick by: broad usefulness (food, transport, safety, things to do),        │
│    not time-sensitive                                                        │
│  • OUTPUT: { type: 'tier_fallback', tierTitle, suggestions: MicroSituation[] }│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Voice → Headline Mapping (Step 1)

**Rule:** A token or concept matches a headline if it is in that headline’s `HEADLINE_KEYWORDS` or in the shared concept map (`QUERY_TERM_TO_CONCEPT` → `CONTENT_WORD_TO_CONCEPT` on the headline text).

**HEADLINE_KEYWORDS** (tokens/phrases that point to a card):

| Headline (conceptual) | HEADLINE_KEYWORDS (voice tokens/concepts) |
|----------------------|-------------------------------------------|
| **I'm Lost / Getting Around** | lost, direction, directions, find, around, getting, metro, bus, taxi, transport, transit, navigate, walk, where |
| **I Need Food Nearby** | hungry, eat, food, restaurant, meal, bite, lunch, dinner, breakfast, starving, cafe, café, coffee, drink, bakery, boulangerie, eat, nearby |
| **I Have Free Time** | free, time, activity, activities, bored, things, do, museum, park, hour, kill, what |
| **Something Feels Off** | safe, unsafe, scared, wrong, scam, suspicious, pickpocket, stolen, feel, off, uncomfortable, danger, weird, creepy |
| **I Don't Know What to Say** | phrase, phrases, language, say, speak, order, english, translate, don't, know, communicate |
| **I'm Tired / Overwhelmed** | tired, overwhelm, overwhelmed, rest, break, quiet, calm, crowded, tourists, choices |
| **Surprise Me / Discover** | discover, spontaneous, surprise, local, hidden, random, explore, different |

**Phrase shortcuts (optional, pre-tokenization):**  
`"I'm hungry"` → food.  
`"I feel unsafe"` / `"I feel off"` → Something Feels Off.  
`"I'm lost"` → I'm Lost / Getting Around.

---

## 3. Voice → MicroSituation Title Mapping (Step 2)

**Within a card**, tokens map to microSituation titles via **VOICE_TO_MICRO** (keywords that suggest a specific micro). If no token matches, use the first micro or all.

**Example: card "I Need Food Nearby"**

| MicroSituation title | VOICE_TO_MICRO (tokens) |
|----------------------|--------------------------|
| Quick Bite | hungry, quick, snack, fast, bite, bakery, sandwich, croissant, cheap |
| Sit-Down Meal | meal, lunch, dinner, restaurant, sit, table, formule, menu, tip, vegetarian, gluten |
| Dietary Restrictions | diet, vegetarian, vegan, gluten, allergy, allergy, allergie |

**Example: card "Something Feels Off"**

| MicroSituation title | VOICE_TO_MICRO (tokens) |
|----------------------|--------------------------|
| Safety Concern | unsafe, safe, scared, danger, emergency, police, ambulance, embassy, avoid, instinct, uncomfortable |
| Scam / Suspicious | scam, suspicious, bracelet, petition, pickpocket, beggar, money, trick |
| Lost Item | lost, wallet, passport, stolen, lost found, police, report, cancel, card |

**Example: card "I'm Lost / Getting Around"**

| MicroSituation title | VOICE_TO_MICRO (tokens) |
|----------------------|--------------------------|
| I'm Lost | lost, find, landmark, map, where |
| Public Transport | metro, bus, ticket, navigo, validate, station |
| Taxi / Ride Share | taxi, uber, bolt, ride, airport |

---

## 4. Action Keywords (Step 3)

- **Input:** `tokens` and the (card, microSituation) from steps 1–2.
- **Rule:** For each action (and `whatToDoInstead`), check `action.toLowerCase().includes(t)` or fuzzy token match for any `t` in `tokens`.
- **Output:** `matchedActions`: list of action strings that contain a matching token. If none, use `microSituation.actions` (e.g. first or all).

---

## 5. Tier-Level Fallback (Step 4)

- **When:** Steps 1–3 yield no (card, microSituation).
- **What:**  
  - `tierTitle` = tier.title (e.g. "Immediate Need").  
  - `suggestions` = 2–3 microSituations chosen by: broad usefulness (food, transport, safety, toilet, things to do), **not** time-sensitive phrases (e.g. "late night", "2am").
- **Output:**  
  `{ type: 'tier_fallback', tierTitle, suggestions: MicroSituationMatch[] }`  
  with `matchType: 'tier_fallback'`, `relevanceScore: 0`, `matchedActions: []`.

---

## 6. Example Mappings

### 6.1 "I'm hungry"

| Step | Input | Logic | Output |
|------|-------|-------|--------|
| Normalize | `"I'm hungry"` | drop "I", "m" (len 1); keep "hungry" | `tokens: ["hungry"]` |
| **1. Headlines** | `["hungry"]` | "hungry" ∈ HEADLINE_KEYWORDS for **I Need Food Nearby** | **Card: "🍽 I Need Food Nearby"** |
| **2. MicroSituation** | `["hungry"]` | "hungry" ∈ VOICE_TO_MICRO for **Quick Bite** | **Micro: "Quick Bite"** |
| **3. Action keywords** | `["hungry"]` | "hungry" not in action text; "food" in "Food trucks…", "Boulangerie…" — optional: match "food" via concept. If we don’t expand, no action keyword → use all actions in "Quick Bite". | **matchedActions: [ "Boulangerie (bakery): croissant €1-2, sandwich €4-6", "Food trucks near tourist sites (€8-12)", "Supermarkets: Carrefour, Monoprix (€5-8 meals)" ]** or first action as lead |
| **4. Tier fallback** | — | not used | — |

**Final:**  
- **Card:** 🍽 I Need Food Nearby  
- **MicroSituation:** Quick Bite  
- **matchedActions:** e.g. first or all 3–4 actions in Quick Bite (or those containing "food"/"eat" if we expand tokens to concept terms).  
- **matchType:** `headline` (or `headline_title` if we also record micro).

---

### 6.2 "I feel unsafe"

| Step | Input | Logic | Output |
|------|-------|-------|--------|
| Normalize | `"I feel unsafe"` | drop "I"; keep "feel", "unsafe" | `tokens: ["feel", "unsafe"]` |
| **1. Headlines** | `["feel", "unsafe"]` | "unsafe" ∈ HEADLINE_KEYWORDS for **Something Feels Off**; "feel" strengthens "Feels Off" | **Card: "😬 Something Feels Off"** |
| **2. MicroSituation** | `["feel", "unsafe"]` | "unsafe", "scared" ∈ VOICE_TO_MICRO for **Safety Concern** | **Micro: "Safety Concern"** |
| **3. Action keywords** | `["feel", "unsafe"]` | "unsafe" no; "feel" no; "comfortable" in "leave if uncomfortable" → fuzzy "comfort"/"uncomfortable" or we match "emergency", "police", "instinct". If we add "safe"/"emergency" from concept: "Emergency: 112…", "Trust your instincts…" match. | **matchedActions: [ "Emergency: 112 (EU), Police 17, Ambulance 15", "Trust your instincts - leave if uncomfortable" ]** |
| **4. Tier fallback** | — | not used | — |

**Final:**  
- **Card:** 😬 Something Feels Off  
- **MicroSituation:** Safety Concern  
- **matchedActions:** e.g. "Emergency: 112 (EU), Police 17, Ambulance 15", "Trust your instincts - leave if uncomfortable" (and optionally "US Embassy: +33 1 43 12 22 22", "Avoid: Gare du Nord area late at night").  
- **matchType:** `headline_title` or `headline`.

---

## 7. Extra Examples (Short)

| Voice | Step 1 (headline) | Step 2 (micro) | Step 3 (actions) |
|-------|-------------------|----------------|------------------|
| "where can I eat" | I Need Food Nearby | (all or first) | those containing "eat"/"restaurant"/"menu" |
| "toilet nearby" | (no headline; could add "Toilet" card or map to a micro) | — | If we add toilet→card: match actions with "toilet", "bathroom", "WC" |
| "I'm lost" | I'm Lost / Getting Around | I'm Lost | actions with "landmark", "map", "metro", "station" |
| "something seems like a scam" | Something Feels Off | Scam / Suspicious | actions with "scam", "ignore", "bracelet", "petition" |
| "I need to rest" | I'm Tired / Overwhelmed | Need Rest | actions with "park", "café", "bench", "library" |
| "surprise me" | Surprise Me | (first or "If you have 15 minutes") | (all or first) |

---

## 8. Implementation

**`src/lib/voiceMatchFlow.ts`** implements this 4-step sequence:

- **`matchVoiceToContent(voiceText, pack)`**  
  - **In:** `voiceText` (STT output), `pack` = `{ city, country?, tier1 }` (e.g. from `getTier1Pack`).  
  - **Out:** `VoiceMatchResult[]` or `TierFallbackResult` (`{ type: 'tier_fallback', tierTitle, suggestions }`).

- **Normalize:** `extractQueryTokens`; `getQueryConcepts` for headline concept match.
- **Step 1:** `HEADLINE_KEYWORDS`: token/concept → normalized headline; `headlineMatches(headline, tokens, concepts)`.
- **Step 2:** `MICRO_KEYWORDS[normalizedHeadline][normalizedMicroTitle]`: tokens; `microTitleMatches(...)`.
- **Step 3:** `matchingActions(tokens, actions, whatToDoInstead)` with `containsSubstring` / `anyTokenMatches`.
- **Step 4:** `getTierFallback(tier, city, tierTitle)`: broad usefulness, not time-sensitive, top 3 microSituations.

**Use from voice UI:**  
After STT: `const out = matchVoiceToContent(transcript, getTier1Pack(city) ?? { city, tier1 })`; if `Array.isArray(out)` render `VoiceMatchResult[]`; else show `out.suggestions` and `out.tierTitle`.
