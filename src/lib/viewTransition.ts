/**
 * Offline-safe view transition helper.
 * Uses View Transitions API when available; falls back to sync update.
 * No network. In-memory state only.
 */

type StartViewTransition = (callback: () => void | Promise<void>) => { ready: Promise<void>; finished: Promise<void> };

function hasViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Run a state update (or any sync callback) inside a view transition when supported.
 * Otherwise run immediately. No API calls.
 *
 * @example
 *   navigate(() => setSelectedCardIndex(index));
 *   navigate(() => { setSelectedMicroSituationIndex(null); setSelectedCardIndex(null); });
 */
export function withViewTransition(fn: () => void): void {
  if (hasViewTransition()) {
    (document as unknown as { startViewTransition: StartViewTransition }).startViewTransition(() => {
      fn();
    });
  } else {
    fn();
  }
}
