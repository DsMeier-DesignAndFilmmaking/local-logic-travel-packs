/**
 * Lightweight Fuzzy Matching
 *
 * No Levenshtein, no FTS lib. For voice/search over the derived index:
 * - Substring / contains
 * - Token-level: one token contains the other or equals
 * - Phrase: all query tokens have at least one match in content
 */

/**
 * True if either string contains the other (for single tokens or short phrases).
 * Case-insensitive.
 */
export function fuzzyTokenMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

/**
 * Content words from a string: lowercase, split on non-alpha, drop very short.
 */
export function toWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s\-']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * True if any query token fuzzy-matches any word in the content string.
 */
export function anyTokenMatches(queryTokens: string[], content: string): boolean {
  if (!content || queryTokens.length === 0) return false;
  const words = toWords(content);
  for (const t of queryTokens) {
    for (const w of words) {
      if (fuzzyTokenMatch(t, w)) return true;
    }
  }
  return false;
}

/**
 * Count of query tokens that have at least one fuzzy match in the content.
 */
export function countTokenMatches(queryTokens: string[], content: string): number {
  if (!content || queryTokens.length === 0) return 0;
  const words = toWords(content);
  let n = 0;
  for (const t of queryTokens) {
    for (const w of words) {
      if (fuzzyTokenMatch(t, w)) {
        n += 1;
        break;
      }
    }
  }
  return n;
}

/**
 * True if the content string contains the exact substring (normalized to lowercase).
 */
export function containsSubstring(content: string, substring: string): boolean {
  if (!content || !substring) return false;
  return content.toLowerCase().includes(substring.toLowerCase());
}

/**
 * True if all query tokens appear in the content in order (as substrings).
 * Gaps allowed. Phrase-style match.
 */
export function phraseContainsInOrder(content: string, queryTokens: string[]): boolean {
  if (!content || queryTokens.length === 0) return false;
  const lower = content.toLowerCase();
  let idx = 0;
  for (const t of queryTokens) {
    const i = lower.indexOf(t.toLowerCase(), idx);
    if (i === -1) return false;
    idx = i + t.length;
  }
  return true;
}

/**
 * True if every query token has at least one fuzzy match in the content.
 */
export function allTokensMatchSomewhere(queryTokens: string[], content: string): boolean {
  if (queryTokens.length === 0) return true;
  const words = toWords(content);
  for (const t of queryTokens) {
    const found = words.some((w) => fuzzyTokenMatch(t, w));
    if (!found) return false;
  }
  return true;
}
