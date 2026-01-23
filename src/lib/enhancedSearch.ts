/**
 * Enhanced Search with Connectivity-Aware Results
 * 
 * Offline search executes immediately
 * Online enhancement upgrades results asynchronously
 */

import { ConnectivityState, checkConnectivityNonBlocking } from './connectivity';
import { quickSearch, SearchResult, SearchOptions } from './offlineSearchEngine';

export interface EnhancedSearchOptions extends SearchOptions {
  enableOnlineEnhancement?: boolean; // Enable online enhancement (default: true)
  onEnhancementComplete?: (enhancedResults: SearchResult[]) => void;
}

export interface EnhancedSearchResult extends SearchResult {
  enhanced?: boolean; // Whether this result was enhanced by online data
  connectivityState?: ConnectivityState;
}

/**
 * Search with connectivity-aware enhancement
 * 
 * Flow:
 * 1. Execute offline search immediately (non-blocking)
 * 2. Check connectivity in parallel (non-blocking)
 * 3. Enhance results asynchronously if online (non-blocking)
 */
export async function searchWithEnhancement(
  cityName: string,
  query: string,
  options: EnhancedSearchOptions = {}
): Promise<{
  immediateResults: EnhancedSearchResult[];
  enhancementPromise: Promise<EnhancedSearchResult[]>;
}> {
  const {
    enableOnlineEnhancement = true,
    onEnhancementComplete,
    ...searchOptions
  } = options;

  // Step 1: Execute offline search immediately (non-blocking, <50ms)
  const immediateResults: EnhancedSearchResult[] = quickSearch(
    cityName,
    query,
    searchOptions
  ).map(result => ({
    ...result,
    enhanced: false,
    connectivityState: undefined,
  }));

  // Step 2: Check connectivity in parallel (non-blocking)
  const { immediateState, promise: connectivityPromise } = 
    checkConnectivityNonBlocking({ timeout: 1000 });

  // Step 3: Enhance results asynchronously if online (non-blocking)
  const enhancementPromise = (async (): Promise<EnhancedSearchResult[]> => {
    if (!enableOnlineEnhancement) {
      return immediateResults;
    }

    // Wait for connectivity check (non-blocking, doesn't delay results)
    const connectivityState = await connectivityPromise;

    if (connectivityState === 'offline') {
      // No enhancement possible
      return immediateResults.map(r => ({
        ...r,
        connectivityState: 'offline',
      }));
    }

    // Online or poor connection - attempt enhancement
    try {
      // TODO: Implement online enhancement logic
      // This could:
      // - Fetch additional results from API
      // - Enhance existing results with online data
      // - Merge online and offline results
      
      // For now, just mark as enhanced
      const enhancedResults: EnhancedSearchResult[] = immediateResults.map(r => ({
        ...r,
        enhanced: connectivityState === 'online',
        connectivityState,
      }));

      if (onEnhancementComplete) {
        onEnhancementComplete(enhancedResults);
      }

      return enhancedResults;
    } catch (error) {
      // Enhancement failed - return original results
      console.warn('Online enhancement failed:', error);
      return immediateResults.map(r => ({
        ...r,
        connectivityState: 'poor',
      }));
    }
  })();

  return {
    immediateResults: immediateResults.map(r => ({
      ...r,
      connectivityState: immediateState,
    })),
    enhancementPromise,
  };
}

/**
 * Simplified search function that returns immediate results
 * Enhancement happens in background
 */
export function searchImmediate(
  cityName: string,
  query: string,
  options: EnhancedSearchOptions = {}
): EnhancedSearchResult[] {
  const { enableOnlineEnhancement = true, onEnhancementComplete, ...searchOptions } = options;

  // Execute offline search immediately
  const immediateResults: EnhancedSearchResult[] = quickSearch(
    cityName,
    query,
    searchOptions
  ).map(result => ({
    ...result,
    enhanced: false,
    connectivityState: undefined,
  }));

  // Start enhancement in background (fire and forget)
  if (enableOnlineEnhancement) {
    const { promise } = checkConnectivityNonBlocking({ timeout: 1000 });
    
    promise.then((connectivityState) => {
      if (connectivityState !== 'offline' && onEnhancementComplete) {
        // Enhance results asynchronously
        const enhancedResults: EnhancedSearchResult[] = immediateResults.map(r => ({
          ...r,
          enhanced: connectivityState === 'online',
          connectivityState,
        }));
        
        onEnhancementComplete(enhancedResults);
      }
    }).catch(() => {
      // Ignore enhancement errors
    });
  }

  return immediateResults;
}
