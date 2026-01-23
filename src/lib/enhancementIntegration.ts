/**
 * Integration of Online Enhancement with Offline Search
 * 
 * Combines offline search with optional online enhancement
 * following all safe-guard rules
 */

import { ConnectivityState, checkConnectivityNonBlocking } from './connectivity';
import { quickSearch, SearchResult, SearchOptions } from './offlineSearchEngine';
import { enhanceSearchResults, EnhancedResult, EnhancementContext, EnhancementOptions } from './onlineEnhancement';
import { getTier1Pack } from './offlineStorage';
import { TravelPack } from './travelPacks';

export interface IntegratedSearchOptions extends SearchOptions {
  enableEnhancement?: boolean;
  enhancementOptions?: EnhancementOptions;
  onEnhancementComplete?: (enhanced: EnhancedResult[]) => void;
}

export interface IntegratedSearchResult {
  immediateResults: EnhancedResult[];
  enhancementPromise: Promise<EnhancedResult[]>;
  connectivityState: ConnectivityState;
}

/**
 * Integrated search with optional enhancement
 * 
 * Flow:
 * 1. Execute offline search immediately
 * 2. Check connectivity in parallel
 * 3. Enhance results if online (async, non-blocking)
 */
export async function integratedSearch(
  cityName: string,
  query: string,
  options: IntegratedSearchOptions = {}
): Promise<IntegratedSearchResult> {
  const {
    enableEnhancement = true,
    enhancementOptions = {},
    onEnhancementComplete,
    ...searchOptions
  } = options;

  // Step 1: Execute offline search immediately
  const immediateResults: SearchResult[] = quickSearch(
    cityName,
    query,
    searchOptions
  );

  // Convert to enhanced format (not yet enhanced)
  const immediateEnhanced: EnhancedResult[] = immediateResults.map(r => ({
    ...r,
    enhanced: false,
    originalScore: r.relevanceScore,
    enhancedScore: r.relevanceScore,
  }));

  // Step 2: Check connectivity in parallel
  const { immediateState, promise: connectivityPromise } = 
    checkConnectivityNonBlocking({ timeout: 1000 });

  // Step 3: Enhance if online (async, non-blocking)
  const enhancementPromise = (async (): Promise<EnhancedResult[]> => {
    if (!enableEnhancement) {
      return immediateEnhanced;
    }

    // Wait for connectivity check
    const connectivityState = await connectivityPromise;

    // Only enhance when online
    if (connectivityState !== 'online') {
      return immediateEnhanced.map(r => ({
        ...r,
        enhanced: false,
      }));
    }

    // Get local pack for grounding
    const tier1Pack = getTier1Pack(cityName);
    if (!tier1Pack || !tier1Pack.tier1) {
      return immediateEnhanced;
    }

    const localPack: TravelPack = {
      city: tier1Pack.city,
      country: tier1Pack.country,
      tiers: {
        tier1: tier1Pack.tier1,
      },
    };

    // Create enhancement context
    const context: EnhancementContext = {
      query,
      city: cityName,
      originalResults: immediateResults,
      localPack,
    };

    try {
      // Enhance results
      const enhanced = await enhanceSearchResults(
        immediateResults,
        context,
        enhancementOptions
      );

      if (onEnhancementComplete) {
        onEnhancementComplete(enhanced);
      }

      return enhanced;
    } catch (error) {
      console.warn('Enhancement failed:', error);
      return immediateEnhanced;
    }
  })();

  return {
    immediateResults: immediateEnhanced,
    enhancementPromise,
    connectivityState: immediateState,
  };
}

/**
 * Get current time of day for context
 */
export function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 2) return 'late_night';
  return 'night';
}
