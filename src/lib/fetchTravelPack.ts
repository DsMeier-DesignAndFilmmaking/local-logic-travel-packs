// src/lib/fetchTravelPacks.ts
import { TravelPack } from '@/types/travel';

/**
 * Check if app is in standalone mode (PWA installed to home screen)
 */
function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

/**
 * Client-safe fetcher. 
 * Instead of using 'fs', it calls your internal API 
 * which handles the server-side file reading.
 * 
 * Gracefully handles offline/standalone mode:
 * - If offline and in standalone mode, silently returns null (data should be in cache)
 * - Suppresses error alerts when offline to avoid "Turn off Airplane Mode" messages
 */
export async function fetchTravelPack(cityName: string): Promise<TravelPack | null> {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isStandalone = isStandaloneMode();
  
  // If offline and in standalone mode, gracefully return null
  // The service worker should have cached the data, and the page will use IndexedDB
  if (isOffline && isStandalone) {
    console.log('📱 Offline in standalone mode - using cached data');
    return null;
  }
  
  try {
    const response = await fetch(`/api/pack?city=${encodeURIComponent(cityName)}`);
    if (!response.ok) {
      // If offline (even if not standalone), don't throw - just return null
      if (isOffline) {
        console.log('📡 Offline - fetch failed, will use cached data');
        return null;
      }
      return null;
    }
    return await response.json();
  } catch (error) {
    // Suppress error logging when offline/standalone
    // The error is expected - data should be in cache/IndexedDB
    if (isOffline && isStandalone) {
      // Silently fail - app should use cached data
      return null;
    }
    
    // Only log errors when online (actual network issues)
    if (!isOffline) {
      console.error("Failed to fetch tactical pack:", error);
    }
    return null;
  }
}