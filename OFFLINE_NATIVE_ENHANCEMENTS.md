# Offline-Safe Native-Feel Enhancements

**Rule:** All enhancements work **offline** and **do not rely on external APIs**. Transitions, gestures, haptics, skeletons, and microinteractions use only: CSS, `navigator.vibrate`, touch/pointer events, and in-memory state.

---

## 1. View / Page Transitions

**Context:** In-app “pages” are React state (ProblemFirstNavigation: cards list → microSituations → MicroSituationView). No client-side routing; no fetch to render the next view.

### 1.1 View Transitions API (progressive)

- **When:** `document.startViewTransition` exists (Chrome 111+, Safari 18+).
- **How:** Wrap the state update in `startViewTransition(() => { setSelectedCardIndex(i); })`. The browser captures old/new DOM and runs a default cross-fade. No API call.
- **Fallback:** If unsupported, the state update runs as today (instant). No extra div or loader.

```ts
// Pseudocode: in ProblemFirstNavigation
const navigate = (fn: () => void) => {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as any).startViewTransition(() => { fn(); });
  } else {
    fn();
  }
};
// onClick: navigate(() => setSelectedCardIndex(index));
```

### 1.2 CSS-based transition (fallback / baseline)

- **Slide + fade:** New view (microSituations or MicroSituationView) gets a class e.g. `.view-enter`: `animation: viewSlideIn 220ms ease-out`.
- **Keyframes (offline-safe, no assets):**

```css
@keyframes viewSlideIn {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.view-enter { animation: viewSlideIn 220ms ease-out; }
```

- **Back:** Same or a `viewSlideOut` for the outgoing view. Prefer a single `view-enter` on the incoming view so we don’t depend on exit detection.

### 1.3 Stagger on list appear

- **When:** Problem cards or microSituation buttons first appear (e.g. after “Back to Problems” or opening a card).
- **How:** `animation-delay: calc(var(--i) * 30ms)` on each card, `--i` from `index`. Max delay ~120–150ms so the list doesn’t feel slow.
- **Respect:** `@media (prefers-reduced-motion: reduce) { animation: none; }`.

### 1.4 Pack block appear

- **When:** Pack becomes available (from cache or after load). Already in-memory; no extra API.
- **How:** A short `fadeIn` or `viewSlideIn` on the pack container (e.g. 200ms). Reuse `animate-fadeIn` or a `.pack-enter` class.

---

## 2. Gesture Behavior

All logic in JS with `touchstart` / `touchmove` / `touchend` (and optionally `pointerdown` / `pointermove` / `pointerup`). No network.

### 2.1 Swipe-from-left-edge to go back

- **Where:** MicroSituationView, and the microSituations list (one level back).
- **Gesture:** Swipe from the left edge (e.g. first 24px) toward the right. Threshold ~60px or 20% of width.
- **Action:** Call existing `onBack()` or `setSelectedMicroSituationIndex(null)` / `setSelectedCardIndex(null)`.
- **Feedback:** Haptic `[8]` on trigger (see Haptics). Optional: slide the view with the finger (`transform: translateX(gestureDelta)`), then animate to 0 or to exit on release.

### 2.2 Long-press on cards (optional)

- **Where:** Problem cards, microSituation buttons.
- **Gesture:** `touchstart` → timer 400–500ms. If `touchend` or `touchmove` (beyond ~10px) before, cancel. On fire: light haptic `[5]`.
- **Action:** No navigation. Options: (a) show a short tooltip (“Tap to open”), (b) slight scale up 1.02 for 150ms then back, (c) just haptic. Keep it subtle; avoid context menus that need API.

### 2.3 Pull-to-refresh (offline-aware)

- **Where:** Top of the pack (or whole page). Only if we have a cached pack and the user might expect “refresh”.
- **Behavior:**
  - **Online:** Normal: pull → release → trigger pack re-fetch (existing logic). No new API contract; reuse current fetch.
  - **Offline:** Pull → release → **do not fetch**. Show a short inline message: *“Using your saved copy. Updates when you’re back online.”* and a light haptic. No spinner that waits on network.
- **Implementation:** Track `touchstart` Y, `touchmove` delta. If pull down &gt; 80px and release, and `navigator.onLine`: run refresh. Else: show the offline message. All logic and copy are local.

### 2.4 `touch-action` and scroll

- **Keep:** `touch-action: manipulation` on tappable blocks to reduce 300ms delay and avoid accidental zoom.
- **Swipe-back:** On the container where we handle edge-swipe, use `touch-action: pan-y` (or `pan-x` only on the edge) so vertical scroll still works. Limit the hit area to the left 24px so the rest of the view scrolls normally.

---

## 3. Haptics

**API:** `navigator.vibrate(pattern)`. Works on many Android devices; no-op or ignored on iOS and some desktop. Safe to call; no network.

### 3.1 When to vibrate

| Action | Pattern | Notes |
|--------|---------|-------|
| **Primary tap** (open card, open microSituation, main CTA) | `[8]` or `[10]` | Light, 8–10ms. |
| **Back** (Back, Home) | `[5]` | Slightly lighter. |
| **Success** (Download / “Saved for offline”, Update done) | `[5, 30, 5]` | Double light tap. |
| **Swipe-back triggered** | `[8]` | Same as primary. |
| **Long-press** (if used) | `[5]` | Light. |
| **Pull-to-refresh (offline)** | `[5]` | Acknowledge without fetch. |
| **Error / “Try again”** | Avoid or `[15]` | Prefer no vibration for errors. |

### 3.2 When not to vibrate

- **`prefers-reduced-motion: reduce`:** Do not vibrate.
- **Unsupported:** `navigator.vibrate` may be undefined; `try { navigator.vibrate([8]); } catch {}` or `if (typeof navigator.vibrate === 'function')`.
- **Rapid repeat:** Debounce (e.g. 80ms) so double-tap doesn’t double-vibrate.
- **Search as-you-type, hover:** No haptics.

### 3.3 Helper (offline-safe)

```ts
// src/lib/haptics.ts
export function hapticLight() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { navigator.vibrate(8); } catch {}
}
export function hapticSuccess() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { navigator.vibrate([5, 30, 5]); } catch {}
}
```

Call from `onClick` of Back, card, microSituation, Download, etc., after the state update. No `await` or network.

---

## 4. Loading Skeletons

**Rule:** Skeleton structure and animation are **pure CSS** (and static HTML/React). The *trigger* can be `isLoading` from a fetch; the skeleton does not fetch.

### 4.1 Pack downloading (current “Loading Travel Pack…”)

- **Replace or augment:** A **card-shaped skeleton** in the pack area:
  - 3–4 blocks: header (title + subtitle), 2–3 card placeholders (rounded, ~140px height, shimmer).
- **Shimmer:** `@keyframes skeleton-shimmer`: `background-position` or `opacity` on a pseudo-element. No image; `linear-gradient` only.
- **Layout:** Matches the real pack (heading + cards) so the transition to real content is a content-swap, not a layout shift.

```css
@keyframes skeleton-shimmer {
  0%   { opacity: 0.6; }
  50%  { opacity: 1; }
  100% { opacity: 0.6; }
}
.skeleton-card { min-height: 140px; border-radius: 12px; background: #E5E7EB; animation: skeleton-shimmer 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .skeleton-card { animation: none; opacity: 0.8; } }
```

### 4.2 In-view transitions (optional)

- **When:** Navigating from cards list → microSituations or → MicroSituationView. Data is already in memory; render is synchronous.
- **Option A:** No skeleton; use **view transition** (slide/fade) only. Feels instant.
- **Option B:** If we want to soften the cut: a **60–120ms** opacity 0→1 on the incoming view. No skeleton; just `opacity` transition. No API.

### 4.3 What to avoid

- Skeleton that waits on a **network** response to decide when to disappear. The trigger is `isLoading` (or similar) from existing fetch logic; the skeleton only reflects that. When `isLoading` becomes false we swap to real content.

---

## 5. Microinteractions

All with **CSS** or a one-off `requestAnimationFrame`/`setTimeout` (e.g. 200ms) to toggle classes. No API.

### 5.1 Button / card press

- **Already:** `active:scale-[0.98]` on problem and microSituation cards.
- **Add:** `transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease` so hover/press don’t snap. `touch-manipulation` stays.

### 5.2 Back / Home links

- **Press:** Slight opacity or `:active { opacity: 0.7 }` for 100ms. Optional: `transform: scale(0.98)`.
- **Haptic:** On click, before or after `onBack`/`onHome`.

### 5.3 Download / “Saved for offline”

- **Before:** Button “Download for Offline Use” (or “Update”).
- **On success:**  
  - Replace label with *“Saved”* and a checkmark icon for ~1.5–2s, then switch to *“Already saved”* or hide.  
  - Optional: `hapticSuccess()`.  
- **Animation:** Checkmark: `stroke-dashoffset` or a small `scale(0)→scale(1)` over 200ms. CSS-only.

### 5.4 Action list items (MicroSituationView)

- **Appear:** Slight `opacity` + `translateY(4px)` → 0 over 150ms, with `animation-delay: calc(index * 40ms)` (max ~200ms). Respect `prefers-reduced-motion`.
- **Optional “Got it”:** If we add a per-action “done”:
  - Checkmark with `stroke-dashoffset` or `scale` animation.  
  - State in `localStorage` or component state only; no API.

### 5.5 Search result / list item tap

- **OfflineSearch, dropdown:** On tap, brief `opacity: 0.9` or `background` change (e.g. 80ms) then close. Optional `hapticLight()`.

### 5.6 Focus and keyboard

- **Focus-visible:** `:focus-visible { outline: 2px solid var(--accent-green); outline-offset: 2px; }` for buttons and links. No network. Keeps keyboard navigation clear.

---

## 6. Respecting `prefers-reduced-motion`

- **Transitions / animations:**  
  `@media (prefers-reduced-motion: reduce) { .view-enter, .animate-fadeIn, .skeleton-card, [data-animate] { animation: none; transition: none; } }`  
  or set `animation-duration: 0.01ms` so layout still runs but the effect is negligible.
- **Haptics:** Skip `navigator.vibrate` when `prefers-reduced-motion: reduce`.
- **Stagger:** Set `animation-delay: 0` when `prefers-reduced-motion: reduce`.

---

## 7. Summary Checklist

| Enhancement | Offline-safe? | API-free? | Notes |
|-------------|---------------|-----------|-------|
| View Transitions API | ✓ | ✓ | In-memory state only. |
| CSS view slide/fade | ✓ | ✓ | Keyframes + class. |
| Stagger on list | ✓ | ✓ | `animation-delay` from index. |
| Swipe-back | ✓ | ✓ | Touch events + `onBack`. |
| Long-press | ✓ | ✓ | `setTimeout` + `touchend` cancel. |
| Pull-to-refresh (offline path) | ✓ | ✓ | Message only; no fetch when offline. |
| Haptics | ✓ | ✓ | `navigator.vibrate`; guard `prefers-reduced-motion`. |
| Skeleton (Pack downloading) | ✓ | ✓ | CSS + `isLoading`; no fetch in skeleton. |
| Button/card transitions | ✓ | ✓ | CSS `transition`. |
| Download success (checkmark) | ✓ | ✓ | CSS + local state. |
| Action list appear | ✓ | ✓ | CSS `animation` + `delay`. |
| Focus-visible | ✓ | ✓ | CSS. |

---

## 8. Files to Touch

| Area | Files |
|------|-------|
| **CSS** | `globals.css`: `viewSlideIn`, `skeleton-shimmer`, `.skeleton-card`, `prefers-reduced-motion` overrides, `:focus-visible`. |
| **Haptics** | `src/lib/haptics.ts`: `hapticLight`, `hapticBack`, `hapticSuccess`, `hapticAck`. |
| **View transition** | `src/lib/viewTransition.ts`: `withViewTransition(fn)`. In `ProblemFirstNavigation.tsx`: wrap `setSelected*` in `withViewTransition`; add `view-enter` to incoming views. |
| **Skeleton** | Replace or augment “Loading Travel Pack…” in `page.tsx` with a `<PackDownloadingSkeleton />` (card-shaped blocks + shimmer). |
| **Gestures** | New `useSwipeBack(onBack, options)` or inline in `MicroSituationView` / microSituations view; `usePullToRefresh` on pack for offline-aware behavior. |
| **Download success** | `Tier1Download`, `TravelPackDownload`: on success, set local state “saved”, show checkmark 1.5s, `hapticSuccess()`, then “Already saved” or hide. |
| **Microinteractions** | Add `btn-press` or `transition` to cards/buttons; optional `animation` and `animation-delay` on action list in `MicroSituationView`. |

---

## 9. Provided Implementations

- **`src/lib/haptics.ts`** — `hapticLight()`, `hapticBack()`, `hapticSuccess()`, `hapticAck()`. All guard `prefers-reduced-motion` and missing `navigator.vibrate`.
- **`src/lib/viewTransition.ts`** — `withViewTransition(fn)` wraps `document.startViewTransition` when available; otherwise runs `fn` immediately.
- **`src/app/globals.css`** — `viewSlideIn`, `.view-enter`, `skeleton-shimmer`, `.skeleton-card`, `.skeleton-line`, `.skeleton-header`, `.btn-press`, `:focus-visible`, and `@media (prefers-reduced-motion: reduce)` overrides.
- **`src/components/PackDownloadingSkeleton.tsx`** — Card-shaped skeleton for the pack area; use when `isLoading` for pack fetch.
