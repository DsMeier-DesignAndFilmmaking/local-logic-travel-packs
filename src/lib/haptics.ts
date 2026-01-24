/**
 * Offline-safe haptics via navigator.vibrate.
 * No network. Respects prefers-reduced-motion.
 */

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (shouldSkip()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

/** Light tap (primary: card, microSituation, main CTA). 8–10ms. */
export function hapticLight(): void {
  vibrate(8);
}

/** Lighter (Back, Home). */
export function hapticBack(): void {
  vibrate(5);
}

/** Success (Download saved, Update done). Double light tap. */
export function hapticSuccess(): void {
  vibrate([5, 30, 5]);
}

/** Pull-to-refresh when offline (acknowledge, no fetch). */
export function hapticAck(): void {
  vibrate(5);
}
