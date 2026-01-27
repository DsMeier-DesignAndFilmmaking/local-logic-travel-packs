/**
 * Manifest Utilities for City-Specific PWA Installations
 */

import { normalizeCityName } from './cities';

/**
 * Get the manifest URL for a specific city
 * @param cityName - The city name (e.g., "Bangkok", "New York City")
 * @returns The manifest API route URL (e.g., "/api/manifest/bangkok")
 */
export function getCityManifestUrl(cityName: string): string {
  const normalized = normalizeCityName(cityName);
  return `/api/manifest/${normalized}`;
}

/**
 * Update the manifest link tag in the document head
 * This is used to switch to a city-specific manifest when a city is selected
 * @param manifestUrl - The URL to the manifest (e.g., "/api/manifest/bangkok")
 */
export function updateManifestLink(manifestUrl: string): void {
  if (typeof window === 'undefined') return;

  // Find existing manifest link
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;

  if (!manifestLink) {
    // Create new manifest link if it doesn't exist
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }

  // Update the href
  manifestLink.href = manifestUrl;

  // Also update the apple-touch-icon if we have city-specific icons
  // For now, we'll keep the default icon
  // TODO: Update when city-specific icons are available
}

/**
 * Reset manifest link to default (app-wide manifest)
 */
export function resetManifestLink(): void {
  if (typeof window === 'undefined') return;
  updateManifestLink('/manifest.json');
}
