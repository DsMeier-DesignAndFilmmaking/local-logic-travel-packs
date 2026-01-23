/**
 * Example Usage of Offline Search Engine
 * 
 * Demonstrates various search scenarios and expected results
 */

import { OfflineSearchEngine, getSearchEngine, quickSearch, SearchOptions } from './offlineSearchEngine';

/**
 * Example 1: Basic keyword search
 */
export function exampleBasicSearch() {
  console.log('=== Example 1: Basic Keyword Search ===');
  
  const results = quickSearch('Paris', 'toilet');
  
  console.log(`Found ${results.length} results`);
  results.slice(0, 3).forEach((result, i) => {
    console.log(`\n${i + 1}. Score: ${result.relevanceScore}`);
    console.log(`   Card: ${result.cardHeadline}`);
    console.log(`   Situation: ${result.microSituationTitle}`);
    console.log(`   Action: ${result.action}`);
    console.log(`   Match Types: ${result.matchTypes.join(', ')}`);
  });
}

/**
 * Example 2: Multi-word query
 */
export function exampleMultiWordQuery() {
  console.log('=== Example 2: Multi-Word Query ===');
  
  const results = quickSearch('Paris', 'late night food');
  
  console.log(`Query: "late night food"`);
  console.log(`Found ${results.length} results`);
  console.log(`\nTop result:`);
  if (results.length > 0) {
    const top = results[0];
    console.log(`  Score: ${top.relevanceScore}`);
    console.log(`  Matched Terms: ${top.matchedTerms.join(', ')}`);
    console.log(`  Action: ${top.action}`);
  }
}

/**
 * Example 3: Time-of-day filtering
 */
export function exampleTimeFiltering() {
  console.log('=== Example 3: Time-of-Day Filtering ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  // Search for food with evening filter
  const eveningResults = engine.search('food', {
    timeOfDay: 'evening',
    limit: 3
  });
  
  console.log(`Evening food results (${eveningResults.length}):`);
  eveningResults.forEach(r => {
    console.log(`  ${r.relevanceScore}: ${r.action.substring(0, 60)}...`);
  });
  
  // Compare with late night filter
  const lateNightResults = engine.search('food', {
    timeOfDay: 'late_night',
    limit: 3
  });
  
  console.log(`\nLate night food results (${lateNightResults.length}):`);
  lateNightResults.forEach(r => {
    console.log(`  ${r.relevanceScore}: ${r.action.substring(0, 60)}...`);
  });
}

/**
 * Example 4: Location-based search
 */
export function exampleLocationSearch() {
  console.log('=== Example 4: Location-Based Search ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  const results = engine.search('restaurants', {
    neighborhood: 'Le Marais',
    limit: 5
  });
  
  console.log(`Restaurants in Le Marais:`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    console.log(`   ${r.action}`);
    if (r.inferredNeighborhood) {
      console.log(`   Location: ${r.inferredNeighborhood}`);
    }
  });
}

/**
 * Example 5: Tag filtering
 */
export function exampleTagFiltering() {
  console.log('=== Example 5: Tag Filtering ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  const results = engine.search('food', {
    tags: ['budget', 'quick'],
    limit: 5
  });
  
  console.log(`Budget/quick food options:`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    console.log(`   Tags: ${r.inferredTags.join(', ')}`);
    console.log(`   ${r.action}`);
  });
}

/**
 * Example 6: Problem-based search
 */
export function exampleProblemSearch() {
  console.log('=== Example 6: Problem-Based Search ===');
  
  const results = quickSearch('Paris', "I'm lost");
  
  console.log(`Query: "I'm lost"`);
  console.log(`Found ${results.length} results`);
  results.slice(0, 3).forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    console.log(`   Problem: ${r.microSituationTitle}`);
    console.log(`   Solution: ${r.action}`);
    console.log(`   Match Types: ${r.matchTypes.join(', ')}`);
  });
}

/**
 * Example 7: Emergency search (high relevance)
 */
export function exampleEmergencySearch() {
  console.log('=== Example 7: Emergency Search ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  const results = engine.search('emergency police', {
    minRelevanceScore: 30, // Only high-relevance results
    limit: 5
  });
  
  console.log(`Emergency results (min score: 30):`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    console.log(`   ${r.cardHeadline}`);
    console.log(`   ${r.action}`);
  });
}

/**
 * Example 8: Auto time detection
 */
export function exampleAutoTime() {
  console.log('=== Example 8: Auto Time Detection ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  const currentTime = engine.getCurrentTimeOfDay();
  console.log(`Current time of day: ${currentTime}`);
  
  const results = engine.searchWithAutoTime('food', {
    autoTime: true,
    limit: 3
  });
  
  console.log(`\nTime-relevant food results:`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    if (r.inferredTimeOfDay) {
      console.log(`   Time: ${r.inferredTimeOfDay}`);
    }
    console.log(`   ${r.action.substring(0, 70)}...`);
  });
}

/**
 * Example 9: Combined filters
 */
export function exampleCombinedFilters() {
  console.log('=== Example 9: Combined Filters ===');
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  const options: SearchOptions = {
    timeOfDay: 'late_night',
    neighborhood: 'City-wide',
    tags: ['food', 'budget'],
    minRelevanceScore: 40,
    limit: 5
  };
  
  const results = engine.search('food', options);
  
  console.log('Combined filter search:');
  console.log(`  Time: ${options.timeOfDay}`);
  console.log(`  Location: ${options.neighborhood}`);
  console.log(`  Tags: ${options.tags?.join(', ')}`);
  console.log(`  Min Score: ${options.minRelevanceScore}`);
  console.log(`\nFound ${results.length} results:`);
  
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.relevanceScore} points`);
    console.log(`   Match Types: ${r.matchTypes.join(', ')}`);
    console.log(`   ${r.action}`);
  });
}

/**
 * Example 10: Performance test
 */
export function examplePerformanceTest() {
  console.log('=== Example 10: Performance Test ===');
  
  const queries = [
    'toilet',
    'late night food',
    "I'm lost",
    'restaurants le marais',
    'unsafe at night',
    'emergency police',
    'metro station',
    'pharmacy medicine'
  ];
  
  const engine = getSearchEngine('Paris');
  if (!engine) return;
  
  queries.forEach(query => {
    const start = performance.now();
    const results = engine.search(query, { limit: 10 });
    const end = performance.now();
    const time = end - start;
    
    console.log(`"${query}": ${results.length} results in ${time.toFixed(2)}ms`);
    if (time > 200) {
      console.warn(`  ⚠️  Exceeded 200ms target!`);
    }
  });
}

/**
 * Example 11: Query variations (same intent)
 */
export function exampleQueryVariations() {
  console.log('=== Example 11: Query Variations ===');
  
  const variations = [
    "I'm hungry",
    'where can I eat',
    'food nearby',
    'restaurants',
    'I need food',
    'places to eat'
  ];
  
  variations.forEach(query => {
    const results = quickSearch('Paris', query);
    if (results.length > 0) {
      const top = results[0];
      console.log(`"${query}" → ${top.relevanceScore} points: ${top.action.substring(0, 50)}...`);
    }
  });
}

// Run all examples (uncomment to test)
// exampleBasicSearch();
// exampleMultiWordQuery();
// exampleTimeFiltering();
// exampleLocationSearch();
// exampleTagFiltering();
// exampleProblemSearch();
// exampleEmergencySearch();
// exampleAutoTime();
// exampleCombinedFilters();
// examplePerformanceTest();
// exampleQueryVariations();
