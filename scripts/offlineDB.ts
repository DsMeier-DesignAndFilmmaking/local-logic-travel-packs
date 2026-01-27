// src/scripts/offlineDB.ts
import { openDB, DBSchema } from 'idb';
import { TravelPack } from '@/types/travel';
import { normalizeCityName } from '@/lib/cities';

interface StoredTravelPack extends TravelPack {
  citySlug: string;
  downloadedAt: string;
}

interface TravelPackDB extends DBSchema {
  packs: {
    key: string; // citySlug (normalized city name)
    value: StoredTravelPack;
  };
}

const DB_NAME = 'travel-packs-db';
const STORE_NAME = 'packs';
const DB_VERSION = 2; // INCREMENTED VERSION to trigger the new keyPath schema

export async function getDB() {
  return openDB<TravelPackDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // If moving from version 1 to 2, we clear the old store to apply the new schema
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
      }
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // keyPath: 'id' or 'citySlug' is safer than manual keys
        db.createObjectStore(STORE_NAME, { keyPath: 'citySlug' });
      }
    },
  });
}

/**
 * Saves a pack with a unique citySlug key.
 * Stores the ENTIRE tiered pack structure for offline access.
 */
export async function savePack(pack: TravelPack): Promise<void> {
  if (!pack?.city) {
    console.warn('Cannot save pack: missing city');
    return;
  }
  
  const db = await getDB();
  const citySlug = normalizeCityName(pack.city);
  
  const packWithMeta: StoredTravelPack = {
    ...pack,
    citySlug, // This acts as the unique ID for the keyPath
    downloadedAt: pack.downloadedAt || new Date().toISOString(),
    offlineReady: true,
  };
  
  await db.put(STORE_NAME, packWithMeta);
}

/**
 * Retrieves a specific pack by city name.
 * Uses normalized city name to match the citySlug keyPath.
 */
export async function getPack(city: string): Promise<TravelPack | null> {
  if (!city) return null;
  const db = await getDB();
  const citySlug = normalizeCityName(city);
  const stored = await db.get(STORE_NAME, citySlug);
  if (!stored) return null;
  
  // Return as TravelPack (remove citySlug from the returned object)
  const { citySlug: _, ...pack } = stored;
  return pack as TravelPack;
}

/**
 * Retrieves all packs, sorted by most recent.
 * Returns TravelPack objects (citySlug removed).
 */
export async function getAllPacks(): Promise<TravelPack[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    
    if (!all || all.length === 0) return [];

    const sorted = all.sort((a, b) => {
      const dateA = new Date(a.downloadedAt || 0).getTime();
      const dateB = new Date(b.downloadedAt || 0).getTime();
      return dateB - dateA;
    });

    // Remove citySlug from returned objects
    return sorted.map(({ citySlug: _, ...pack }) => pack as TravelPack);
  } catch (error) {
    console.error("DB Retrieval Error:", error);
    return [];
  }
}

/**
 * Deletes a pack by city name.
 * Uses normalized city name to match the citySlug keyPath.
 */
export async function deletePack(city: string): Promise<void> {
  if (!city) return;
  const db = await getDB();
  const citySlug = normalizeCityName(city);
  await db.delete(STORE_NAME, citySlug);
}