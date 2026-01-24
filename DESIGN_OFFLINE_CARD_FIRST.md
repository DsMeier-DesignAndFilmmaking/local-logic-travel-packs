# Offline-Friendly Card-First UI: Wireframe-Level Design

## Design goals

- **Emotional / situational headlines** — Cards and situations speak to how the user feels or what’s happening (“I’m lost”, “I need food nearby”), not generic topics.
- **Quick scanning** — User can choose a card in one glance; supporting text is secondary.
- **Low cognitive load** — One main decision per level; no long lists, no dense blocks before the tap.
- **Tap-first** — All primary paths are tap/click; no hover-only or keyboard-only actions. Works offline; motion is CSS-only or simple JS (no network-dependent animation).

---

## 1. Card layout

### 1.1 Viewport and grid

```
┌─────────────────────────────────────────────────────────┐
│  Viewport (web)                                         │
│  min-width: 320px   max-content: 640px (centered)       │
│  horizontal padding: 16px (320–479) / 24px (480+)       │
└─────────────────────────────────────────────────────────┘

Card grid:
- 1 column only (no side‑by‑side cards).
- Gap between cards: 16px (320–479) / 24px (480+).
- Cards full-width within content area.
```

**Rule:** Cards never sit side-by-side. One card per row so the headline is the main scan target and tap targets stay large on small viewports.

---

### 1.2 Problem card (Level 1 — “What do you need right now?”)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [HEADLINE]                    [CHEVRON OR ARROW]       │
│  Emotional/situational,        Right-aligned,           │
│  one line when possible        indicates tap            │
│                                                         │
│  [META]  e.g. “3 situations”   (optional, subdued)      │
│                                                         │
└─────────────────────────────────────────────────────────┘

Structure:
- Container: block, full-width, rounded corners (12px–16px).
- Padding: 20px (320–479) / 24px (480+).
- Min height: 88px (ensures 44px+ tap height with padding).
- Internal: flex row, space-between, align start.
  - Left: headline + optional meta.
  - Right: chevron/arrow icon.
- Border or shadow to separate from background (exact style TBD).
```

**Headline rule:** Use the card’s `headline` as-is when it’s emotional/situational. If it’s topic-based, prefer a situational microSituation `title` as the card’s primary label (content model may need to support this). No truncation in the main wireframe; one line is the target.

**Meta (optional):** e.g. “X situations”. Subdued; does not compete with the headline. Can be omitted for even lower load.

---

### 1.3 MicroSituation card (Level 2 — “Choose a situation”)

Same layout as the Problem card, one level down in hierarchy:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [TITLE]                         [CHEVRON]              │
│  Situation title                 right-aligned          │
│                                                         │
│  [META]  e.g. “4 actions”       (optional)              │
│                                                         │
└─────────────────────────────────────────────────────────┘

Structure:
- Same container rules as Problem card.
- Min height: 72px.
- Padding: 16px (320–479) / 20px (480+).
```

---

### 1.4 Action block (Level 3 — “What to do”)

Not a tappable card; read-only. Scannable list:

```
┌─────────────────────────────────────────────────────────┐
│  What to do:                                            │
├─────────────────────────────────────────────────────────┤
│  │ 1.  [Action text, one or more lines, left-aligned]   │
├─────────────────────────────────────────────────────────┤
│  │ 2.  [Action text]                                    │
├─────────────────────────────────────────────────────────┤
│  │ 3.  [Action text]                                    │
└─────────────────────────────────────────────────────────┘

Structure:
- Section heading: “What to do:” (or local equivalent).
- List: vertical stack, gap 12px.
- Each item:
  - Flex row, gap 12px, align start.
  - Left: number (1. 2. 3.) in a fixed-width area; no wrap.
  - Right: action text, full-width, multi-line allowed.
  - Optional: left border or accent bar on the item block for scan.
- Item padding: 12px vertical, 16px horizontal; block padding so tap height is comfortable if we later add “copy” or similar.

```

---

### 1.5 “What to do instead” block

```
┌─────────────────────────────────────────────────────────┐
│  💡 What to do instead:                                 │
│  [Advice paragraph, one or more lines]                  │
└─────────────────────────────────────────────────────────┘

Structure:
- Block below the actions list; only if `whatToDoInstead` exists.
- Heading + body; both left-aligned.
- Padding and spacing consistent with action items; visual treatment (e.g. border/background) distinct so it reads as “extra tip” not “another step”.
```

---

## 2. Tap hierarchy

### 2.1 Levels and primary action

| Level | Screen / block      | Primary tap                         | Result                          |
|-------|---------------------|-------------------------------------|---------------------------------|
| 0     | Pack / chrome       | Back, Home, Search, city            | Navigate or change context      |
| 1     | Problem cards       | Whole card                          | Open MicroSituation list        |
| 2     | MicroSituation list | Whole MicroSituation card           | Open Actions + What to do instead |
| 3     | Actions             | None (read-only)                    | —                               |

**Rule:** The only primary taps in the content flow are (1) Problem card and (2) MicroSituation card. Actions are read-only; no tap required to “get” the content.

---

### 2.2 Tap target rules

- **Minimum tap height:** 44px (including padding). Card min-heights and padding are chosen so the full card meets or exceeds this.
- **Tap area:** The entire card (Problem and MicroSituation) is one tap target. No separate “title” vs “chevron” tap; one `button` or `click` handler per card.
- **Cursor:** pointer on cards. Default for buttons/links; no special cursor for static blocks.

---

### 2.3 Back and Home

- **Back:** One step up (MicroSituation → Problem list, or Problem list → Pack/previous).
- **Home / “All problems”:** Jump to Problem cards from anywhere below.
- Placement: top of the content area, above the main heading of the current level. Same on every level so it’s findable without learning.
- Tap target: at least 44px tall (e.g. icon + label). Group as: `[← Back] • [All problems]` or stacked on very small viewports.

---

### 2.4 Order of elements (top to bottom)

**Level 1 — Problem cards**

1. Optional: section title + short subtitle (e.g. “What do you need right now?”).
2. Vertical list of Problem cards.

**Level 2 — MicroSituations**

1. Back / Home.
2. Card headline (repeated as context).
3. Subtitle (e.g. “Choose a situation”).
4. Vertical list of MicroSituation cards.

**Level 3 — Actions**

1. Back / Home.
2. Card headline (context).
3. MicroSituation title.
4. “What to do:” + action list.
5. If present: “What to do instead” block.

---

## 3. Typography scale

All in `px` for wireframe consistency. Final implementation can use `rem` with the same ratios.

### 3.1 Scale (wireframe)

| Token     | Size | Line height | Use                                                    |
|----------|------|-------------|--------------------------------------------------------|
| `-3`     | 12px | 1.25        | Meta, captions, “X situations”, “X actions”            |
| `-2`     | 14px | 1.35        | Secondary text, subtitles, Back/Home labels            |
| `-1`     | 16px | 1.4         | Body, action text, “What to do instead” body           |
| `0`      | 18px | 1.35        | MicroSituation card title, “What to do:” heading       |
| `1`      | 20px | 1.3         | Problem card headline (small viewport)                 |
| `2`      | 24px | 1.25        | Problem card headline (480+), MicroSituation context   |
| `3`      | 28px | 1.2         | Page/section titles (e.g. “What do you need right now?”) |

**Rule:** One dominant size per block. Problem card = headline (`1` or `2`); MicroSituation card = title (`0`); actions = body (`-1`). Meta and labels stay `-3` or `-2`.

---

### 3.2 Weight

- **Headlines (card, situation, section):** Bold (700 or font-bold).
- **“What to do:”, “What to do instead:”:** Semibold (600) or Bold.
- **Body, actions, advice:** Regular (400).
- **Meta, Back/Home:** Medium (500) so they’re tappable but not dominant.

---

### 3.3 Line length and spacing

- **Max line length (body, actions):** ~60ch. Card and content width cap supports this.
- **Block spacing:**
  - After Back/Home: 16px.
  - After main heading (card/situation): 8px.
  - After subtitle: 16px.
  - Between cards: 16px (320–479) / 24px (480+).
  - Between action items: 12px.
  - After “What to do:” and before first action: 12px.

---

## 4. Motion and transition rules (offline-safe)

All motion must work with no network. Only CSS transitions/animations or simple, synchronous JS (e.g. toggling classes). No video, no animated SVGs that depend on remote assets, no runtime-loaded animation libs for the core flow.

---

### 4.1 Page / level changes

- **Technique:** CSS `transition` on `opacity` or `transform` (e.g. `translateY`). Duration 200–280ms, ease-out.
- **Behavior:** On “tap card → next level”, the outgoing block fades out or moves out (e.g. up) and the incoming block fades in or moves in (e.g. from bottom). Or: full view replacement with a short fade (150–200ms).
- **Fallback:** If transitions are disabled or not supported, an instant swap is acceptable. No broken or half-visible states.

---

### 4.2 Tap (press) feedback

- **Technique:** CSS only. `:active` or a class toggled on `pointerdown`/`pointerup` (or `touchstart`/`touchend`).
- **Options (pick one per card type, keep it consistent):**
  - **Scale:** `transform: scale(0.98)` on press; back to `scale(1)` on release. 80–120ms.
  - **Opacity:** `opacity: 0.9` on press; 80–120ms.
  - **Background:** Slight darkening or lightening of the card; 80–120ms.
- **Rule:** Feedback must start within ~100ms of pointer/touch down. No dependency on `mouseup`/`touchend` for *starting* the effect; release returns to rest.

---

### 4.3 Scroll

- **Technique:** Native scroll. Optional: `scroll-behavior: smooth` for in-page anchor or “scroll to top” after navigation. No custom scroll physics that require JS animation frames.
- **Overscroll:** Default browser behavior; no custom pull-to-refresh or similar that needs network.

---

### 4.4 Lists (cards, actions)

- **Stagger on first paint:** Optional. If used: `animation-delay` per item (e.g. +40ms per index), `opacity` 0→1 or `translateY` 4–8px→0. Max ~4 items staggered; rest appear together. Duration per item 120–180ms, ease-out.
- **Rule:** Stagger is purely decorative. If `prefers-reduced-motion: reduce`, disable stagger and optional level transitions; keep only tap feedback or remove it too.

---

### 4.5 `prefers-reduced-motion`

- When `prefers-reduced-motion: reduce`:
  - Disable or shorten level-change transitions (or make them instant).
  - Disable stagger.
  - Tap feedback: keep only very subtle feedback (e.g. opacity 0.97) or none; avoid scale.
- Implementation: `@media (prefers-reduced-motion: reduce) { … }` or a class on `<html>` set via JS.

---

### 4.6 No network-dependent motion

- No animation that waits on `fetch` or `load` events.
- No Lottie or similar that loads from a URL.
- No “loading” or “skeleton” animation that implies data is coming from the network for the Tier 1 card → microSituation → actions path; that data is local. Loading states are only for network-backed features (e.g. city autocomplete, pack fetch).

---

## 5. Wireframe structure summary

### 5.1 Level 1 — Problem cards

```
[Section title — 3]
[Subtitle — -2]

[Problem card]     ← Headline 1/2, meta -3, chevron, min-h 88px, 12–16px radius
  16–24px gap
[Problem card]
  16–24px gap
[Problem card]
…
```

### 5.2 Level 2 — MicroSituations

```
[← Back] • [All problems]   — -2, medium, 44px min tap height
  16px
[Card headline — 2]         (context)
  8px
[Subtitle — -2]             “Choose a situation”
  16px
[MicroSituation card]       ← Title 0, meta -3, chevron, min-h 72px
  16–24px gap
[MicroSituation card]
…
```

### 5.3 Level 3 — Actions

```
[← Back] • [All problems]   — -2, medium
  16px
[Card headline — -2]        (context)
  8px
[MicroSituation title — 2]
  16px
What to do:                 — 0, semibold
  12px
[Action 1]                  — -1, number + text, 12px gap between items
[Action 2]
[Action 3]
…

[If whatToDoInstead]
  16px
💡 What to do instead:      — 0, semibold
[Advice — -1]
```

---

## 6. Content and copy notes (for headlines)

- **Problem cards:** Prefer emotional or situational phrasing: “I’m lost”, “I need food nearby”, “Something feels off”, “I have free time”. Avoid pure topic labels like “Transport” or “Food” unless the product tone is more formal.
- **MicroSituations:** Short situation labels: “Quick bite”, “I’m lost”, “Safety concern”. User should recognize their case in one scan.
- **Actions:** Imperative, one main idea per sentence where possible. No need for full sentences if a short phrase is clear (e.g. “Find nearest metro (look for ‘M’ signs)”).

---

## 7. Offline consistency

- The same card layout, tap hierarchy, typography, and motion rules apply online and offline for Tier 1.
- No layout variation, no removal of Back/Home, and no different tap targets when offline.
- Motion uses only CSS or simple, synchronous JS; no dependency on network or remote assets.
