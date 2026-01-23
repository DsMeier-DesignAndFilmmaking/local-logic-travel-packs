/**
 * Example Usage of Offline Fallback Search
 * 
 * Demonstrates guaranteed offline fallback with positive messaging
 */

import { fallbackSearch, SearchState } from './offlineFallbackSearch';
import { getSearchUXState, getConnectivityMessage } from './offlineFallbackUX';
import { ConnectivityState } from './connectivity';

/**
 * Example 1: Basic fallback search
 */
export function exampleBasicFallback() {
  console.log('=== Example 1: Basic Fallback Search ===');
  
  const { results, state, message } = fallbackSearch('Paris', 'late night food', {
    minRelevanceScore: 5,
    limit: 10,
  });
  
  console.log(`State: ${state}`);
  console.log(`Message: ${message}`);
  console.log(`Results: ${results.length}`);
  
  results.slice(0, 3).forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.microSituationTitle}`);
    console.log(`   Priority: ${r.matchPriority}, Score: ${r.relevanceScore}`);
    console.log(`   Match Types: ${r.matchTypes.join(', ')}`);
  });
}

/**
 * Example 2: Offline state messaging
 */
export function exampleOfflineMessaging() {
  console.log('=== Example 2: Offline State Messaging ===');
  
  const { results, state } = fallbackSearch('Paris', 'toilet', {
    connectivityState: 'offline',
  });
  
  const uxState = getSearchUXState(state, results.length, 'offline');
  
  console.log(`Message: ${uxState.message}`);
  console.log(`Tone: ${uxState.tone}`);
  console.log(`Show Empty: ${uxState.showEmptyState}`);
  console.log(`Icon: ${uxState.icon}`);
}

/**
 * Example 3: Poor connection messaging
 */
export function examplePoorConnection() {
  console.log('=== Example 3: Poor Connection Messaging ===');
  
  const { results, state } = fallbackSearch('Paris', 'restaurants', {
    connectivityState: 'poor',
  });
  
  const uxState = getSearchUXState(state, results.length, 'poor');
  
  console.log(`Message: ${uxState.message}`);
  console.log(`Tone: ${uxState.tone}`);
}

/**
 * Example 4: No results (truly no matches)
 */
export function exampleNoResults() {
  console.log('=== Example 4: No Results ===');
  
  const { results, state } = fallbackSearch('Paris', 'xyzabc123nonexistent', {
    minRelevanceScore: 5,
  });
  
  const uxState = getSearchUXState(state, results.length);
  
  console.log(`State: ${state}`);
  console.log(`Message: ${uxState.message}`);
  console.log(`Tone: ${uxState.tone}`);
  console.log(`Show Empty: ${uxState.showEmptyState}`);
  if (uxState.suggestions) {
    console.log(`Suggestions: ${uxState.suggestions.join(', ')}`);
  }
}

/**
 * Example 5: Matching priority demonstration
 */
export function exampleMatchingPriority() {
  console.log('=== Example 5: Matching Priority ===');
  
  const queries = [
    "I'm hungry",           // Should match spoken phrase (Priority 2)
    'food',                 // Should match tag (Priority 4)
    'restaurant',           // Should match keyword (Priority 6)
    'late night food',      // Should match multiple (Priority 2 + 4)
  ];
  
  queries.forEach(query => {
    const { results } = fallbackSearch('Paris', query, { limit: 1 });
    if (results.length > 0) {
      const top = results[0];
      console.log(`\nQuery: "${query}"`);
      console.log(`  Top result: ${top.microSituationTitle}`);
      console.log(`  Priority: ${top.matchPriority}`);
      console.log(`  Score: ${top.relevanceScore}`);
      console.log(`  Match Types: ${top.matchTypes.join(', ')}`);
    }
  });
}

/**
 * Example 6: Connectivity-aware messaging
 */
export function exampleConnectivityAware() {
  console.log('=== Example 6: Connectivity-Aware Messaging ===');
  
  const connectivityStates: ConnectivityState[] = ['online', 'poor', 'offline'];
  const query = 'toilet';
  
  connectivityStates.forEach(connectivityState => {
    const { results } = fallbackSearch('Paris', query, {
      connectivityState,
    });
    
    const message = getConnectivityMessage(connectivityState, results.length);
    console.log(`\n${connectivityState}:`);
    console.log(`  Message: ${message}`);
    console.log(`  Results: ${results.length}`);
  });
}

/**
 * Example 7: Spoken phrases matching
 */
export function exampleSpokenPhrases() {
  console.log('=== Example 7: Spoken Phrases Matching ===');
  
  const spokenQueries = [
    "I'm hungry",
    "I'm lost",
    "I feel unsafe",
    "Where can I eat",
    "I need help",
  ];
  
  spokenQueries.forEach(query => {
    const { results } = fallbackSearch('Paris', query, { limit: 1 });
    if (results.length > 0) {
      const top = results[0];
      const hasSpokenMatch = top.matchTypes.some(t => t.includes('spoken-phrase'));
      console.log(`\n"${query}"`);
      console.log(`  Matched: ${top.microSituationTitle}`);
      console.log(`  Spoken phrase match: ${hasSpokenMatch ? 'Yes' : 'No'}`);
      console.log(`  Priority: ${top.matchPriority}`);
    }
  });
}

/**
 * Example 8: Tag matching
 */
export function exampleTagMatching() {
  console.log('=== Example 8: Tag Matching ===');
  
  const tagQueries = [
    'food',
    'navigation',
    'safety',
    'restaurants',
  ];
  
  tagQueries.forEach(query => {
    const { results } = fallbackSearch('Paris', query, { limit: 1 });
    if (results.length > 0) {
      const top = results[0];
      const hasTagMatch = top.matchTypes.some(t => t.includes('tag'));
      console.log(`\n"${query}"`);
      console.log(`  Matched: ${top.microSituationTitle}`);
      console.log(`  Tag match: ${hasTagMatch ? 'Yes' : 'No'}`);
      console.log(`  Priority: ${top.matchPriority}`);
    }
  });
}

// Run examples (uncomment to test)
// exampleBasicFallback();
// exampleOfflineMessaging();
// examplePoorConnection();
// exampleNoResults();
// exampleMatchingPriority();
// exampleConnectivityAware();
// exampleSpokenPhrases();
// exampleTagMatching();
