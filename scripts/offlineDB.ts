// src/scripts/offlineDB.ts
import { openDB, DBSchema } from 'idb';

interface TravelPackDB extends DBSchema {
  packs: {
    key: string; // city name
    value: any;   // your JSON travel pack
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

// Save a travel pack
export async function savePack(pack: any) {
  const db = await getDB();
  await db.put(STORE_NAME, pack, pack.city);
}

// Get a travel pack by city
export async function getPack(city: string) {
  const db = await getDB();
  return db.get(STORE_NAME, city);
}

// Get a travel pack by city
export async function getTier1Pack(city: string) {
    const db = await getDB();
    return db.get(STORE_NAME, city);
  }

// Get all stored packs
export async function getAllPacks() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

// Delete a pack
export async function deletePack(city: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, city);
}
