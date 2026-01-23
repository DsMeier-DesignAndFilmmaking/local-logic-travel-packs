/**
 * Preload all travel pack JSON files for offline access
 * Fetches all available city packs via API so they're cached by the service worker
 */

/**
 * Get list of all available cities with travel packs
 */
async function getAvailableCities(): Promise<string[]> {
  try {
    const response = await fetch('/api/cities/list');
    if (!response.ok) {
      console.warn('Failed to fetch city list for preloading');
      return [];
    }
    const data = await response.json();
    return data.cities || [];
  } catch (error) {
    console.warn('Error fetching city list:', error);
    return [];
  }
}

/**
 * Preload a single travel pack for a city
 * This will trigger the service worker to cache the response
 */
async function preloadCityPack(city: string): Promise<void> {
  try {
    const cityName = city.split(',')[0].trim(); // Extract just city name
    const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(cityName)}`);
    
    if (response.ok) {
      // Consume the response to ensure it's cached
      await response.json();
      console.log(`✓ Preloaded pack for: ${cityName}`);
    } else {
      console.warn(`Failed to preload pack for: ${cityName} (${response.status})`);
    }
  } catch (error) {
    // Silently fail - this is expected if offline or network issues
    console.warn(`Offline cache preload for ${city}:`, error);
  }
}

/**
 * Preload all available travel packs for offline access
 * This should be called on initial page load to ensure all Tier 1 packs are cached
 * 
 * @param options Configuration options
 * @param options.batchSize Number of packs to fetch concurrently (default: 3)
 * @param options.delayMs Delay between batches in milliseconds (default: 100)
 */
export async function preloadAllPacks(options?: {
  batchSize?: number;
  delayMs?: number;
}): Promise<void> {
  const { batchSize = 3, delayMs = 100 } = options || {};

  // Check if service worker is registered
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service worker not available, skipping preload');
    return;
  }

  // Note: Service worker caching is disabled in development mode (see next.config.ts)
  // Preloading will still work but won't cache in dev mode

  console.log('Starting preload of all travel packs for offline access...');
  
  const cities = await getAvailableCities();
  
  if (cities.length === 0) {
    console.warn('No cities found for preloading');
    return;
  }

  console.log(`Preloading ${cities.length} travel packs...`);

  // Fetch packs in batches to avoid overwhelming the network
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    
    // Fetch all packs in the current batch concurrently
    await Promise.all(batch.map(city => preloadCityPack(city)));
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < cities.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`✓ Completed preloading ${cities.length} travel packs`);
}

/**
 * Preload packs in the background with low priority
 * Uses requestIdleCallback if available, otherwise setTimeout
 */
export function preloadAllPacksBackground(): void {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback for background preloading (browser optimization)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      preloadAllPacks().catch(err => {
        console.warn('Background preload failed:', err);
      });
    }, { timeout: 5000 }); // Start within 5 seconds even if browser is busy
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadAllPacks().catch(err => {
        console.warn('Background preload failed:', err);
      });
    }, 2000);
  }
}
