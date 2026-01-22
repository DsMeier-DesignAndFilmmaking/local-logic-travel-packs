/**
 * City Suggestion Helper
 * 
 * Returns top city matches based on string similarity.
 * Uses simple case-insensitive matching with startsWith filter.
 * 
 * This is kept internal - no UI changes required.
 * Can be used for validation, normalization, or future autocomplete.
 */

import { SUPPORTED_CITIES } from './cities';

export interface CitySuggestion {
  city: string;
  score: number;
}

/**
 * Suggest cities based on query string (simple startsWith matching)
 * 
 * Returns cities that start with the input string (case-insensitive).
 * 
 * @param input - User input string
 * @param limit - Maximum number of suggestions (default: 5)
 * @returns Array of city names
 */
export function suggestCities(input: string, limit: number = 5): string[] {
  if (!input) return [];

  const lower = input.toLowerCase();

  return SUPPORTED_CITIES
    .filter(city => city.toLowerCase().startsWith(lower))
    .slice(0, limit);
}

/**
 * Find exact city match (case-insensitive)
 * 
 * @param query - User input string
 * @returns Matched city name or null
 */
export function findExactCityMatch(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  const match = SUPPORTED_CITIES.find(
    (city) => city.toLowerCase() === queryLower
  );
  return match || null;
}

/**
 * Check if a city is supported
 * 
 * @param city - City name to check
 * @returns True if city is in supported list
 */
export function isCitySupported(city: string): boolean {
  return findExactCityMatch(city) !== null;
}
