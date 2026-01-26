// src/scripts/offlineDB.ts
import { openDB, DBSchema } from 'idb';

interface TravelPackDB extends DBSchema {
  packs: {
    key: string; // city name (lowercase)
    value: any;   // The pack object including downloadedAt
  };
}

const DB_NAME = 'travel-packs-db';
const STORE_NAME = 'packs';
const DB_VERSION = 1;

export async function getDB() {
  return openDB<TravelPackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Saves a pack.
 * We ensure a lowercase key and verify the downloadedAt timestamp exists.
 */
export async function savePack(pack: any) {
  const db = await getDB();
  const key = pack.city.toLowerCase().trim();
  
  // Ensure we have a timestamp for sorting later
  const packWithMeta = {
    ...pack,
    downloadedAt: pack.downloadedAt || new Date().toISOString()
  };
  
  await db.put(STORE_NAME, packWithMeta, key);
}

/**
 * Retrieves a specific pack by city name.
 */
export async function getPack(city: string) {
  const db = await getDB();
  return db.get(STORE_NAME, city.toLowerCase().trim());
}

/**
 * Retrieves all packs and sorts them by most recent download.
 * This is used by page.tsx to auto-load the vault on the Home Screen.
 */
export async function getAllPacks() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  
  // Sort by downloadedAt descending (Newest first)
  return all.sort((a, b) => {
    const dateA = new Date(a.downloadedAt || 0).getTime();
    const dateB = new Date(b.downloadedAt || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Deletes a pack (useful for clearing the vault).
 */
export async function deletePack(city: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, city.toLowerCase().trim());
}