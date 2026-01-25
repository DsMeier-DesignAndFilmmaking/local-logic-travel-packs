/**
 * Hardened Preload logic for Local Logic Travel Packs
 */

async function getAvailableCities(): Promise<string[]> {
  // Check navigator.onLine before even attempting a fetch
  if (typeof window !== 'undefined' && !navigator.onLine) return [];

  try {
    const response = await fetch('/api/cities/list');
    if (!response.ok) return [];
    const data = await response.json();
    return data.cities || [];
  } catch (error) {
    console.warn('Unable to fetch city list (offline or server down)');
    return [];
  }
}

async function preloadCityPack(city: string): Promise<void> {
  try {
    const cityName = city.split(',')[0].trim();
    // Use { cache: 'force-cache' } or similar if you want to bypass 
    // certain browser restrictions, but the SW handles this primarily.
    const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(cityName)}`);
    
    if (response.ok) {
      await response.json(); // Consuming the body ensures it's cached
      console.log(`✓ Cached: ${cityName}`);
    }
  } catch (error) {
    // This is now a silent failure for background tasks
    // Prevent "Uncaught (in promise)" errors in the console
  }
}

export async function preloadAllPacks(options?: {
  batchSize?: number;
  delayMs?: number;
}): Promise<void> {
  const { batchSize = 3, delayMs = 150 } = options || {};

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!navigator.onLine) {
    console.log('Skipping preload: Device is currently offline.');
    return;
  }

  const cities = await getAvailableCities();
  if (cities.length === 0) return;

  for (let i = 0; i < cities.length; i += batchSize) {
    // Only continue if we are still online
    if (!navigator.onLine) break;

    const batch = cities.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(city => preloadCityPack(city)));
    
    if (i + batchSize < cities.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export function preloadAllPacksBackground(): void {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    preloadAllPacks().catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runPreload, { timeout: 10000 });
  } else {
    setTimeout(runPreload, 3000);
  }
}