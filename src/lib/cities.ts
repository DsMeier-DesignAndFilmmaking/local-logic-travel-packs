/**
 * Supported Cities List
 * 
 * Lightweight city source for validation and suggestions.
 * This list can be expanded as more cities are added to the platform.
 */

export const SUPPORTED_CITIES = [
  'Paris',
  'London',
  'Rome',
  'Barcelona',
  'Amsterdam',
  'Lisbon',
  'Berlin',
  'Prague',
  'Vienna',
  'Budapest',
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];
