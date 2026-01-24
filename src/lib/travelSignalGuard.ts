/**
 * Travel Signal Guard
 *
 * Runs after stop-word removal. Short-circuits offline search when the query
 * has no travel intent, so we never show "no results found" for non-travel
 * input. Does not throw; does not block offline behavior.
 */

/** Friendly message when no travel signal is detected. Shown instead of "no results found". */
export const NO_SIGNAL_MESSAGE =
  "Try asking about food, places, or things to do nearby.";

/**
 * High-level travel intent: food, drink, place, safety, transport, etc.
 * Used for token-based matching after stop-word removal. A token must match
 * one of these (exact, case-insensitive) to pass the guard.
 */
export const TRAVEL_KEYWORDS = [
  "eat", "food", "restaurant", "bar", "drink",
  "coffee", "cafe", "museum", "walk", "park",
  "safe", "unsafe", "night", "late",
  "local", "tourist", "area", "neighborhood",
  "lost", "direction", "map", "metro", "bus", "train", "taxi",
  "toilet", "bathroom", "restroom", "wc",
  "pharmacy", "hospital", "doctor", "emergency", "police",
  "atm", "cash", "money", "bank",
  "wifi", "internet", "sim", "phone",
  "hotel", "accommodation", "stay",
  "attraction", "sight", "see", "visit", "tour",
  "shopping", "market", "store", "shop",
  "language", "speak", "say", "communicate",
  "tired", "rest", "overwhelmed",
  "time", "free", "do", "activity", "things",
  "nearby", "close", "far", "distance",
  "recommend", "suggest", "best", "good",
  "avoid", "skip", "tip", "advice", "help", "need",
];

/**
 * Return shape when the guard short-circuits: no search is run, no errors,
 * no "no results found". Caller should show `message` and use `results` as [].
 */
export interface TravelSignalNoSignalResult {
  type: "no_signal";
  message: string;
  results: [];
}

/**
 * Guard that runs after stop-word removal. Use the resulting tokens from
 * extractQueryTokens.
 *
 * Why: Reduces "no results found" for non-travel queries (e.g. "what's the
 * weather", "change system settings"). We short-circuit and return a clear
 * shape instead of running search and then showing a dead end.
 *
 * - If no tokens remain → no_signal (all stop-words).
 * - If none of the tokens match TRAVEL_KEYWORDS → no_signal (no travel intent).
 * - Otherwise → proceed.
 *
 * Does not throw. Does not block offline.
 */
export function checkTravelSignalFromTokens(
  tokens: string[]
): TravelSignalNoSignalResult | { type: "proceed" } {
  if (tokens.length === 0) {
    return { type: "no_signal", message: NO_SIGNAL_MESSAGE, results: [] };
  }

  const set = new Set(TRAVEL_KEYWORDS.map((k) => k.toLowerCase()));
  const hasMatch = tokens.some((t) => set.has(t.toLowerCase()));

  if (!hasMatch) {
    return { type: "no_signal", message: NO_SIGNAL_MESSAGE, results: [] };
  }

  return { type: "proceed" };
}

/**
 * Check if query contains any travel signal
 */
export function hasTravelSignal(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }

  const queryLower = query.toLowerCase().trim();
  
  // Check if any travel keyword appears in the query
  return TRAVEL_KEYWORDS.some(keyword => 
    queryLower.includes(keyword.toLowerCase())
  );
}

/**
 * Get default offline suggestions when no travel signal detected
 * Returns helpful suggestions based on common travel needs
 */
export function getDefaultOfflineSuggestions(): Array<{
  cardHeadline: string;
  microSituationTitle: string;
  action: string;
  city: string;
}> {
  return [
    {
      cardHeadline: "💡 Try asking about:",
      microSituationTitle: "Food & Dining",
      action: "Ask: 'Where can I eat?' or 'Late night food'",
      city: "",
    },
    {
      cardHeadline: "💡 Try asking about:",
      microSituationTitle: "Getting Around",
      action: "Ask: 'I'm lost' or 'How do I get to...'",
      city: "",
    },
    {
      cardHeadline: "💡 Try asking about:",
      microSituationTitle: "Safety & Emergency",
      action: "Ask: 'I feel unsafe' or 'Emergency help'",
      city: "",
    },
    {
      cardHeadline: "💡 Try asking about:",
      microSituationTitle: "Places & Activities",
      action: "Ask: 'What to do nearby?' or 'Museums'",
      city: "",
    },
  ];
}

/**
 * Travel signal guard result
 */
export interface TravelSignalGuardResult {
  type: 'fallback' | 'proceed';
  message?: string;
  results?: Array<{
    cardHeadline: string;
    microSituationTitle: string;
    action: string;
    city: string;
  }>;
}

/**
 * Check travel signal and return guard result
 */
export function checkTravelSignal(query: string): TravelSignalGuardResult {
  if (!hasTravelSignal(query)) {
    return {
      type: 'fallback',
      message: "Try asking about food, places, or things to do nearby.",
      results: getDefaultOfflineSuggestions(),
    };
  }

  return {
    type: 'proceed',
  };
}
