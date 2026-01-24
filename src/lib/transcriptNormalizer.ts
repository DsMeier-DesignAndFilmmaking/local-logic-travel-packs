/**
 * Transcript Normalizer
 *
 * Offline-only, deterministic stop-word removal for voice search.
 * No AI, no external libraries. Used by offline search utilities only.
 */

/**
 * Stop words: filler, meta, and non-travel words.
 * Filler: um, uh, like, etc.
 * Meta: please, can, you, change, system, etc.
 * Non-travel: articles, conjunctions, prepositions, question words.
 */
export const STOP_WORDS = [
  // Filler
  "um", "uh", "er", "ah", "oh", "well", "like", "just", "really", "very",
  "quite", "actually", "basically", "literally", "maybe", "probably",
  "perhaps", "sort", "kind", "know", "mean", "think", "guess",
  // Meta (speech-to-system, polite)
  "please", "can", "you", "change", "system", "right", "now",
  "i", "me", "my", "we", "this", "that", "it", "its", "it's",
  // Non-travel (articles, conjunctions, prepositions)
  "the", "a", "an", "is", "to", "for", "of", "with", "from",
  "in", "on", "at", "by", "and", "or", "but", "so", "if", "then",
  // Question words (intent carried by the remaining noun/verb)
  "what", "where", "when", "why", "how",
];

/**
 * Extract query tokens from a raw transcript for offline search.
 *
 * - Lowercases and trims the string
 * - Splits on whitespace into tokens
 * - Removes stop-words (filler, meta, non-travel)
 * - Drops empty strings and single-character tokens
 * - Deterministic; no network, no AI
 *
 * @example
 * extractQueryTokens("  Where can I eat late tonight  ")
 * // => ["eat", "late", "tonight"]
 *
 * @example
 * extractQueryTokens("um like toilet nearby please")
 * // => ["toilet", "nearby"]
 *
 * @example
 * extractQueryTokens("is this area safe at night")
 * // => ["area", "safe", "night"]
 */
export function extractQueryTokens(transcript: string): string[] {
  if (!transcript || typeof transcript !== "string") {
    return [];
  }

  const lower = transcript.toLowerCase().trim();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  const tokens = words
    .filter((word) => !STOP_WORDS.includes(word))
    .filter((word) => word.length > 1);

  if (typeof process !== "undefined" && process?.env?.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[extractQueryTokens]", { in: transcript, out: tokens });
  }

  return tokens;
}

/**
 * Normalize transcript for search
 * Removes filler, meta phrases, and accidental speech
 */
export function normalizeTranscript(transcript: string): string {
  if (!transcript || typeof transcript !== 'string') {
    return '';
  }

  // Extract meaningful tokens
  const tokens = extractQueryTokens(transcript);

  // Rejoin into normalized query
  return tokens.join(' ');
}

/**
 * Clean transcript more aggressively
 * Removes common voice recognition artifacts
 */
export function cleanTranscript(transcript: string): string {
  if (!transcript || typeof transcript !== 'string') {
    return '';
  }

  let cleaned = transcript
    // Remove common voice artifacts
    .replace(/\b(um|uh|er|ah|oh)\b/gi, ' ')
    .replace(/\b(like|you know|i mean|i think|i guess)\b/gi, ' ')
    // Remove punctuation that might confuse search
    .replace(/[.,!?;:]/g, ' ')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize
  cleaned = normalizeTranscript(cleaned);

  return cleaned;
}

/**
 * Check if transcript has meaningful content after normalization
 */
export function hasMeaningfulContent(transcript: string): boolean {
  const tokens = extractQueryTokens(transcript);
  return tokens.length > 0;
}

/**
 * Check if query has tokens remaining after normalization
 * Returns true if tokens exist, false if only stop words remain
 */
export function hasSearchableTokens(query: string): boolean {
  const tokens = extractQueryTokens(query);
  return tokens.length > 0;
}

/**
 * Extract search intent from transcript
 * Returns the core query without filler
 */
export function extractSearchIntent(transcript: string): string {
  const cleaned = cleanTranscript(transcript);
  
  // If cleaned transcript is too short, return original (might be a single important word)
  if (cleaned.length < 2) {
    return transcript.trim();
  }

  return cleaned;
}
