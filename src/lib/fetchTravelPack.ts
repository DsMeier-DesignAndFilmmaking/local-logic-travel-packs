/**
 * Data Coordinator for Travel Packs
 * * Logic:
 * 1. Try to find a local JSON file in /data/travelPacks
 * 2. If not found, return null (allowing the UI to trigger AI generation)
 * 3. Fallback to Paris ONLY if absolutely necessary for UI stability
 */

import { TravelPack, getTravelPackForCity } from './travelPacks';
import { normalizeCityName } from './cities';

/**
 * Orchestrates the retrieval of a travel pack.
 * Note: This version is designed for Client-Side or Server-Side use.
 */
export function fetchTravelPack(cityName: string): TravelPack | null {
  if (!cityName || !cityName.trim()) return null;

  // 1. Normalize the search term (e.g., "Paris, France" -> "paris")
  const normalizedSearch = normalizeCityName(cityName);

  // 2. Attempt to pull from our local JSON repository (data/travelPacks/*.json)
  // This uses the fuzzy matching logic we built in travelPacks.ts
  const pack = getTravelPackForCity(cityName);

  if (pack) {
    console.log(`🛡️ Vault: Local asset found for ${cityName}`);
    return pack;
  }

  // 3. If no local asset exists, return null.
  // This tells the UI to show the "Generate with AI" button instead of 
  // lying to the user by showing them Paris data for London.
  console.warn(`⚠️ Vault: No local asset for ${cityName}. AI Generation required.`);
  return null;
}