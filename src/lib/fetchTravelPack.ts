/**
 * Fetch Travel Pack for City
 * 
 * Returns TravelInsight[] for a given city.
 * Falls back to Paris gold-standard pack for unknown cities.
 * 
 * This function works with the Tier 1-3 Travel Pack structure.
 * Future: Will fetch from API or generate with AI.
 */

import { TravelInsight } from './travelPackSchema';
import { parisTravelInsights } from '@/data/parisTravelInsights';

/**
 * Extract city name from full city string (e.g., "Paris, Île-de-France, France" -> "Paris")
 */
function extractCityName(fullCityName: string): string {
  // Handle formats like "Paris, Île-de-France, France" or just "Paris"
  const parts = fullCityName.split(',');
  return parts[0].trim();
}

/**
 * Fetch travel pack insights for a city
 * 
 * Currently returns Paris pack for all cities (gold-standard fallback).
 * Future: Will fetch city-specific packs from API or generate with AI.
 * 
 * @param cityName - Full city name (e.g., "Paris, Île-de-France, France") or just city name
 * @returns Array of TravelInsight objects (Tier 1-3 structure)
 */
export function fetchTravelPackForCity(cityName: string): TravelInsight[] {
  if (!cityName || !cityName.trim()) {
    // Return Paris as default
    return parisTravelInsights;
  }

  const city = extractCityName(cityName);

  // TODO: Check if we have city-specific pack data
  // For now, return Paris pack for all cities (gold-standard fallback)
  // Future: 
  // 1. Check database/API for city-specific pack
  // 2. If not found, generate with AI
  // 3. If AI fails, fallback to Paris

  // Normalize city name for comparison (case-insensitive)
  const normalizedCity = city.toLowerCase();

  // For now, only Paris has data - return Paris pack
  // Future: Add more city packs here
  if (normalizedCity === 'paris') {
    return parisTravelInsights;
  }

  // Unknown cities → fallback to Paris gold-standard pack
  return parisTravelInsights;
}
