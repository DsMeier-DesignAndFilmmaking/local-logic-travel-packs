/**
 * Supported Cities Configuration
 */

// 1. Core "Featured" Cities (Hardcoded for instant UI suggestions)
export const SUPPORTED_CITIES = [
  'Bangkok',
  'Paris',
  'London',
  'Dubai',
  'Singapore',
  'New York City',
  'Kuala Lumpur',
  'Istanbul',
  'Tokyo',
  'Antalya',
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];

/**
 * HELPER: Normalize city names for consistent DB and File lookup.
 * Example: "New York City" -> "new_york_city"
 */
export const normalizeCityName = (city: string): string => {
  return city
    .toLowerCase()
    .trim()
    .split(',')[0]          // Remove country if present (e.g., "Paris, France")
    .replace(/\s+/g, '_')   // Replace spaces with underscores
    .replace(/[^\w]/g, ''); // Remove special characters
};

/**
 * HELPER: Validate if a string is a supported city.
 * Useful for API route protection.
 */
export const isSupportedCity = (city: string): city is SupportedCity => {
  return SUPPORTED_CITIES.includes(city as SupportedCity);
};