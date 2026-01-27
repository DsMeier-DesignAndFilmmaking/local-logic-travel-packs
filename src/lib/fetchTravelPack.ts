// src/lib/fetchTravelPacks.ts
import { TravelPack } from '@/types/travel';

/**
 * Client-safe fetcher. 
 * Instead of using 'fs', it calls your internal API 
 * which handles the server-side file reading.
 */
export async function fetchTravelPack(cityName: string): Promise<TravelPack | null> {
  try {
    const response = await fetch(`/api/pack?city=${encodeURIComponent(cityName)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch tactical pack:", error);
    return null;
  }
}