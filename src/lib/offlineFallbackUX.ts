/**
 * Offline Fallback UX States and Messaging
 * 
 * Provides positive, helpful messaging without error tone
 * Never uses words like "error", "failed", "unavailable"
 */

import { ConnectivityState } from './connectivity';
import { SearchState } from './offlineFallbackSearch';

export type UXTone = 'positive' | 'neutral' | 'helpful';

export interface UXState {
  message: string;
  tone: UXTone;
  showEmptyState: boolean;
  icon?: string;
  suggestions?: string[];
}

/**
 * Get UX state for search results
 */
export function getSearchUXState(
  state: SearchState,
  resultsCount: number,
  connectivityState?: ConnectivityState
): UXState {
  if (state === 'local_results') {
    return getLocalResultsUX(resultsCount, connectivityState);
  }
  
  return getNoResultsUX();
}

/**
 * UX state for local results
 */
function getLocalResultsUX(
  resultsCount: number,
  connectivityState?: ConnectivityState
): UXState {
  if (connectivityState === 'offline' || connectivityState === 'poor') {
    return {
      message: 'Showing results from your downloaded pack',
      tone: 'positive',
      showEmptyState: false,
      icon: '📦',
      suggestions: [
        'All results are from your downloaded pack',
        'Works completely offline',
        'No internet connection needed',
      ],
    };
  }
  
  return {
    message: `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} in your pack`,
    tone: 'positive',
    showEmptyState: false,
    icon: '✅',
  };
}

/**
 * UX state for no results
 */
function getNoResultsUX(): UXState {
  return {
    message: 'No matching content found. Try different keywords or browse the pack categories.',
    tone: 'helpful',
    showEmptyState: true,
    icon: '💡',
    suggestions: [
      'Try simpler keywords',
      'Check the quick search suggestions',
      'Browse categories in the pack',
      'Try related terms',
    ],
  };
}

/**
 * Get connectivity-aware message
 */
export function getConnectivityMessage(
  connectivityState?: ConnectivityState,
  resultsCount?: number
): string {
  if (!connectivityState) {
    return resultsCount 
      ? `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''}`
      : 'Searching...';
  }
  
  switch (connectivityState) {
    case 'offline':
      return 'Showing results from your downloaded pack';
    
    case 'poor':
      return 'Using your downloaded pack (connection is slow)';
    
    case 'online':
      return resultsCount
        ? `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} in your pack`
        : 'Searching your pack...';
    
    default:
      return 'Searching...';
  }
}

/**
 * Get empty state message (only shown when truly no results)
 */
export function getEmptyStateMessage(query?: string): {
  title: string;
  message: string;
  suggestions: string[];
} {
  return {
    title: 'No results found',
    message: query
      ? `No matching content found for "${query}". Try different keywords or browse the pack categories.`
      : 'No matching content found. Try different keywords or browse the pack categories.',
    suggestions: [
      'Try simpler or different keywords',
      'Check the quick search suggestions below',
      'Browse categories in your pack',
      'Try related terms or synonyms',
    ],
  };
}

/**
 * Get loading state message
 */
export function getLoadingMessage(): string {
  return 'Searching your pack...';
}

/**
 * Get success state message
 */
export function getSuccessMessage(
  resultsCount: number,
  connectivityState?: ConnectivityState
): string {
  if (connectivityState === 'offline' || connectivityState === 'poor') {
    return `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} from your downloaded pack`;
  }
  
  return `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} in your pack`;
}

/**
 * Positive messaging examples (avoid error language)
 */
export const POSITIVE_MESSAGES = {
  offline: 'Showing results from your downloaded pack',
  poorConnection: 'Using your downloaded pack (connection is slow)',
  searching: 'Searching your pack...',
  found: (count: number) => `Found ${count} result${count !== 1 ? 's' : ''} in your pack`,
  noResults: 'No matching content found. Try different keywords or browse the pack categories.',
};

/**
 * Messages to avoid (error tone)
 */
export const AVOID_MESSAGES = [
  'Error',
  'Failed',
  'Unavailable',
  'Connection failed',
  'Network error',
  'Unable to connect',
  'Search failed',
  'No connection',
  'Offline mode',
  'Limited functionality',
];
