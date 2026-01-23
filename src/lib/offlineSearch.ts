/**
 * Offline Search Utilities
 * Local-only search for Tier 1 content (works offline)
 * 
 * Enhanced with ranked search engine (see offlineSearchEngine.ts)
 */

import { getTier1Pack } from './offlineStorage';
import { TravelPack } from './travelPacks';
import { quickSearch, SearchOptions as EngineSearchOptions } from './offlineSearchEngine';
import type { SearchResult as EngineSearchResult } from './offlineSearchEngine';

export type SearchResult = {
  cardHeadline: string;
  microSituationTitle: string;
  action: string;
  city: string;
};

/**
 * Enhanced search result with ranking information
 */
export type EnhancedSearchResult = SearchResult & {
  relevanceScore: number;
  matchTypes: string[];
  matchedTerms: string[];
  whatToDoInstead?: string;
};

/**
 * Search Tier 1 content offline
 * Searches through cards, microSituations, and actions
 * Offline-only: Uses preloaded JSON data from localStorage, no network calls
 */
export function searchOffline(cityName: string, query: string): SearchResult[] {
  // Get offline Tier 1 pack from localStorage (no network call)
  const tier1Pack = getTier1Pack(cityName);
  if (!tier1Pack || !tier1Pack.tier1) {
    return [];
  }

  const results: SearchResult[] = [];
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return results;
  }

  // Search through all cards, microSituations, and actions
  // Filters preloaded JSON data instantly
  tier1Pack.tier1.cards.forEach((card) => {
    card.microSituations.forEach((microSituation) => {
      microSituation.actions.forEach((action) => {
        // Check if search term appears in action, microSituation title, card headline, or whatToDoInstead
        const actionLower = action.toLowerCase();
        const microTitleLower = microSituation.title.toLowerCase();
        const cardHeadlineLower = card.headline.toLowerCase();
        const whatToDoInsteadLower = microSituation.whatToDoInstead?.toLowerCase() || '';

        if (
          actionLower.includes(searchTerm) ||
          microTitleLower.includes(searchTerm) ||
          cardHeadlineLower.includes(searchTerm) ||
          whatToDoInsteadLower.includes(searchTerm)
        ) {
          // Avoid duplicates by checking if this exact result already exists
          const isDuplicate = results.some(
            (r) =>
              r.cardHeadline === card.headline &&
              r.microSituationTitle === microSituation.title &&
              r.action === action
          );

          if (!isDuplicate) {
            results.push({
              cardHeadline: card.headline,
              microSituationTitle: microSituation.title,
              action,
              city: tier1Pack.city,
            });
          }
        }
      });
    });
  });

  return results;
}

/**
 * Enhanced offline search with ranking
 * Uses the new search engine for better results
 * 
 * @param cityName - City to search in
 * @param query - Search query
 * @param options - Search options (timeOfDay, neighborhood, tags, etc.)
 * @returns Ranked search results
 */
export function searchOfflineEnhanced(
  cityName: string,
  query: string,
  options?: EngineSearchOptions
): EnhancedSearchResult[] {
  const engineResults = quickSearch(cityName, query, options);
  
  // Convert engine results to enhanced search results
  return engineResults.map(result => ({
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

/**
 * Get common emergency search terms
 */
export const EMERGENCY_TERMS = [
  'toilet',
  'bathroom',
  'restroom',
  'ATM',
  'cash',
  'pharmacy',
  'medicine',
  'hospital',
  'doctor',
  'police',
  'emergency',
  'lost',
  'SIM',
  'wifi',
  'internet',
  'bus',
  'metro',
  'train',
  'taxi',
  'airport',
  'embassy',
  'consulate',
];
