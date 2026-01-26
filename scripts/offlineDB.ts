// src/scripts/offlineDB.ts
import { openDB, DBSchema } from 'idb';

interface TravelPackDB extends DBSchema {
  packs: {
    key: string; // city name (lowercase/slugified)
    value: {
      city: string;
      downloadedAt: string;
      [key: string]: any; // Allows for the rest of your pack data
    };
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
 */
export async function savePack(pack: any) {
  if (!pack?.city) return;
  
  const db = await getDB();
  const citySlug = pack.city.toLowerCase().trim();
  
  const packWithMeta = {
    ...pack,
    citySlug, // This acts as the unique ID for the keyPath
    downloadedAt: pack.downloadedAt || new Date().toISOString()
  };
  
  return db.put(STORE_NAME, packWithMeta);
}

/**
 * Retrieves a specific pack by city name.
 */
export async function getPack(city: string) {
  if (!city) return null;
  const db = await getDB();
  return db.get(STORE_NAME, city.toLowerCase().trim());
}

/**
 * Retrieves all packs, sorted by most recent.
 */
export async function getAllPacks() {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    
    if (!all || all.length === 0) return [];

    return all.sort((a, b) => {
      const dateA = new Date(a.downloadedAt || 0).getTime();
      const dateB = new Date(b.downloadedAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("DB Retrieval Error:", error);
    return [];
  }
}

export async function deletePack(city: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, city.toLowerCase().trim());
}