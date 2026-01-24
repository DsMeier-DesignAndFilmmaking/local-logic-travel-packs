/**
 * Supported Cities List
 * 
 * Lightweight city source for validation and suggestions.
 * This list can be expanded as more cities are added to the platform.
 */

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
