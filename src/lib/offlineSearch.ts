/**
 * Offline Search Utilities
 * Local-only search for Tier 1 content (works offline)
 *
 * Uses situational search: matches human/voice language → situations (microSituations),
 * with lightweight fuzzy matching and emotional/situational phrase priority.
 * See offlineSituationalSearch.ts for matching order, scoring, and fallback.
 */

import { getTier1Pack } from './offlineStorage';
import type { TravelPack } from './travelPacks';
import { quickSearch, SearchOptions as EngineSearchOptions } from './offlineSearchEngine';
import type { SearchResult as EngineSearchResult } from './offlineSearchEngine';
import {
  checkTravelSignalFromTokens,
  TravelSignalNoSignalResult,
} from './travelSignalGuard';
import { extractSearchIntent, extractQueryTokens } from './transcriptNormalizer';
import { searchSituational } from './offlineSituationalSearch';
import type { MicroSituationMatch } from './offlineSituationalSearch';

export type { MicroSituationMatch };

/** @deprecated Use MicroSituationMatch. Kept for searchOfflineEnhanced / engine. */
export type SearchResult = {
  cardHeadline: string;
  microSituationTitle: string;
  action: string;
  city: string;
};

/** Return shape when search runs but finds no strong match; we return high-value microSituations. */
export interface TravelSignalFallbackResult {
  type: 'fallback';
  message: string;
  results: MicroSituationMatch[];
}

/** Result of searchOffline: microSituation matches, no_signal short-circuit, or fallback. */
export type SearchOfflineResult =
  | MicroSituationMatch[]
  | TravelSignalNoSignalResult
  | TravelSignalFallbackResult;

const FALLBACK_MESSAGE = 'Showing useful situations from your downloaded pack';

/**
 * Search Tier 1 content offline.
 * Returns microSituations (not raw action snippets), with situational and fuzzy matching.
 *
 * Travel-signal guard (after stop-word removal):
 * - No tokens left, or no token matches TRAVEL_KEYWORDS → short-circuit with
 *   { type: "no_signal", message, results: [] }.
 * - Does not throw. Does not block offline.
 *
 * When no strong match: returns { type: 'fallback', message, results } with
 * 2–3 high-value microSituations.
 */
export function searchOffline(
  cityName: string,
  query: string
): MicroSituationMatch[] | TravelSignalNoSignalResult | TravelSignalFallbackResult {
  const tokens = extractQueryTokens(query);

  const guard = checkTravelSignalFromTokens(tokens);
  if (guard.type === 'no_signal') {
    return guard;
  }

  const tier1Pack = getTier1Pack(cityName);
  if (!tier1Pack || !tier1Pack.tier1) {
    return [];
  }

  const searchInput = {
    city: tier1Pack.city,
    country: tier1Pack.country,
    tier1: tier1Pack.tier1,
  };

  const normalizedQuery = extractSearchIntent(query);
  const raw = searchSituational(searchInput, normalizedQuery || query);

  if (raw.length > 0 && raw[0].matchType === 'fallback') {
    return { type: 'fallback', message: FALLBACK_MESSAGE, results: raw };
  }

  return raw;
}

/**
 * Enhanced offline search with ranking (time-of-day, neighborhood, tags).
 * Uses OfflineSearchEngine; returns action-level results. For situational
 * microSituation-level results, use searchOffline.
 */
export type EnhancedSearchResult = SearchResult & {
  relevanceScore: number;
  matchTypes: string[];
  matchedTerms: string[];
  whatToDoInstead?: string;
};

export function searchOfflineEnhanced(
  cityName: string,
  query: string,
  options?: EngineSearchOptions
): EnhancedSearchResult[] {
  const engineResults = quickSearch(cityName, query, options);
  return engineResults.map((result) => ({
    cardHeadline: result.cardHeadline,
    microSituationTitle: result.microSituationTitle,
    action: result.action,
    city: result.city,
    relevanceScore: result.relevanceScore,
    matchTypes: result.matchTypes,
    matchedTerms: result.matchedTerms,
    whatToDoInstead: result.whatToDoInstead,
  }));
}

export const EMERGENCY_TERMS = [
  'toilet', 'bathroom', 'restroom', 'ATM', 'cash', 'pharmacy', 'medicine',
  'hospital', 'doctor', 'police', 'emergency', 'lost', 'SIM', 'wifi', 'internet',
  'bus', 'metro', 'train', 'taxi', 'airport', 'embassy', 'consulate',
];
