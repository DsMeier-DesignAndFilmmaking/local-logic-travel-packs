// src/scripts/offlineDB.ts
import { openDB, DBSchema } from 'idb';

interface TravelPackDB extends DBSchema {
  packs: {
    key: string; 
    value: any;   
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

export async function savePack(pack: any) {
  const db = await getDB();
  // Ensure we are saving with a consistent key (lowercase trimmed)
  const key = pack.city.toLowerCase().trim();
  await db.put(STORE_NAME, pack, key);
}

export async function getPack(city: string) {
  const db = await getDB();
  return db.get(STORE_NAME, city.toLowerCase().trim());
}

export async function getAllPacks() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  // Return most recently saved (assuming you add a timestamp or use array order)
  return all;
}