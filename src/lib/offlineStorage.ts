/**
 * Offline Storage Utilities
 * Handles localStorage-based caching of travel packs for offline access
 * Offline-first: Tier 1 content is always cached and available offline
 */

import { TravelPack } from '@/types/travel';

const STORAGE_KEY = 'travel-packs';
const TIER1_STORAGE_KEY = 'travel-packs-tier1'; // Separate key for Tier 1 offline access

export interface StoredPack extends TravelPack {
  downloadedAt: string;
}

/**
 * Store a travel pack in localStorage for offline access
 * Offline-first: Always stores Tier 1 separately for guaranteed offline access
 */
export function storePackLocally(pack: TravelPack): void {
  try {
    const storedPacks = getStoredPacks();
    const citySlug = pack.city.toLowerCase().replace(/\s+/g, '-');
    
    const packWithMetadata: StoredPack = {
      ...pack,
      downloadedAt: new Date().toISOString(),
    };
    
    storedPacks[citySlug] = packWithMetadata;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPacks));
    
    // Offline-first: Always cache Tier 1 separately for guaranteed offline access
    if (pack.tiers?.tier1) {
      const tier1Packs = getTier1Packs();
      tier1Packs[citySlug] = {
        city: pack.city,
        country: pack.country,
        tier1: pack.tiers.tier1,
        downloadedAt: new Date().toISOString(),
      };
      localStorage.setItem(TIER1_STORAGE_KEY, JSON.stringify(tier1Packs));
    }
  } catch (err) {
    console.error('Error storing pack locally:', err);
    // Handle quota exceeded error
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Clearing old packs...');
      clearOldPacks();
    }
  }
}

/**
 * Get Tier 1 packs (offline-first, always available)
 */
export function getTier1Packs(): Record<string, { city: string; country: string; tier1: TravelPack['tiers']['tier1']; downloadedAt: string }> {
  try {
    const stored = localStorage.getItem(TIER1_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error('Error reading Tier 1 packs:', err);
    return {};
  }
}

/**
 * Get Tier 1 pack for a specific city (offline-first)
 */
export function getTier1Pack(cityName: string): { city: string; country: string; tier1: TravelPack['tiers']['tier1']; downloadedAt: string } | null {
  const tier1Packs = getTier1Packs();
  const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
  return tier1Packs[citySlug] || null;
}

/**
 * Get all stored packs from localStorage
 */
export function getStoredPacks(): Record<string, StoredPack> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.error('Error reading stored packs:', err);
    return {};
  }
}

/**
 * Get a specific stored pack by city name
 */
export function getStoredPack(cityName: string): StoredPack | null {
  const storedPacks = getStoredPacks();
  const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
  return storedPacks[citySlug] || null;
}

/**
 * Check if a pack is stored locally
 */
export function isPackStored(cityName: string): boolean {
  return getStoredPack(cityName) !== null;
}

/**
 * Clear old packs if storage is full (keeps last 10 packs)
 */
function clearOldPacks(): void {
  try {
    const storedPacks = getStoredPacks();
    const entries = Object.entries(storedPacks);
    
    // Sort by download date (newest first)
    entries.sort((a, b) => {
      const dateA = new Date(a[1].downloadedAt).getTime();
      const dateB = new Date(b[1].downloadedAt).getTime();
      return dateB - dateA;
    });
    
    // Keep only the 10 most recent
    const recentPacks = entries.slice(0, 10);
    const newStorage: Record<string, StoredPack> = {};
    
    recentPacks.forEach(([key, pack]) => {
      newStorage[key] = pack;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStorage));
  } catch (err) {
    console.error('Error clearing old packs:', err);
  }
}

/**
 * Clear all stored packs
 */
export function clearAllStoredPacks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing stored packs:', err);
  }
}
