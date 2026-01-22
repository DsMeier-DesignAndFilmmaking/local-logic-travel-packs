/**
 * Offline storage module
 * 
 * Handles storing travel packs in IndexedDB/localStorage for offline access
 * 
 * TODO: Implement IndexedDB storage for pack data
 * TODO: Implement localStorage for pack metadata
 * TODO: Add storage quota management
 * TODO: Implement storage cleanup/eviction strategies
 */

import { Pack } from '@/types';

const DB_NAME = 'travel-packs-db';
const DB_VERSION = 1;
const STORE_NAME = 'packs';

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Download and store a travel pack for offline use
 * @param pack - The travel pack to store
 */
export async function downloadPackToStorage(pack: Pack): Promise<void> {
  if (!('indexedDB' in window)) {
    throw new Error('IndexedDB is not supported in this browser');
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(pack);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Also store metadata in localStorage for quick access
    const metadata = {
      id: pack.id,
      city: pack.city,
      downloadedAt: new Date().toISOString(),
    };
    localStorage.setItem(`pack-${pack.id}`, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error storing pack:', error);
    throw error;
  }
}

/**
 * Retrieve a stored pack from IndexedDB
 * @param packId - The ID of the pack to retrieve
 * @returns The stored pack or null if not found
 */
export async function getStoredPack(packId: string): Promise<Pack | null> {
  if (!('indexedDB' in window)) {
    return null;
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(packId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error retrieving pack:', error);
    return null;
  }
}

/**
 * Get all stored pack IDs
 * @returns Array of stored pack IDs
 */
export async function getStoredPackIds(): Promise<string[]> {
  if (!('indexedDB' in window)) {
    return [];
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error retrieving pack IDs:', error);
    return [];
  }
}

/**
 * Delete a stored pack
 * @param packId - The ID of the pack to delete
 */
export async function deleteStoredPack(packId: string): Promise<void> {
  if (!('indexedDB' in window)) {
    return;
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(packId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Also remove from localStorage
    localStorage.removeItem(`pack-${packId}`);
  } catch (error) {
    console.error('Error deleting pack:', error);
    throw error;
  }
}
