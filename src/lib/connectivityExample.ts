/**
 * Example Usage of Connectivity Check
 * 
 * Demonstrates non-blocking connectivity checks with search
 */

import { 
  checkConnectivity, 
  checkConnectivityNonBlocking,
  ConnectivityMonitor,
  getConnectivityMonitor,
  ConnectivityState 
} from './connectivity';
import { searchImmediate, searchWithEnhancement } from './enhancedSearch';
import { quickSearch } from './offlineSearchEngine';

/**
 * Example 1: Basic connectivity check
 */
export async function exampleBasicCheck() {
  console.log('=== Example 1: Basic Connectivity Check ===');
  
  const state = await checkConnectivity({
    timeout: 1000,
  });
  
  console.log(`Connectivity state: ${state}`);
}

/**
 * Example 2: Non-blocking connectivity check
 */
export function exampleNonBlockingCheck() {
  console.log('=== Example 2: Non-Blocking Connectivity Check ===');
  
  const { immediateState, promise } = checkConnectivityNonBlocking({
    timeout: 1000,
  });
  
  console.log(`Immediate state: ${immediateState}`);
  
  promise.then((refinedState) => {
    console.log(`Refined state: ${refinedState}`);
  });
}

/**
 * Example 3: Search with connectivity-aware enhancement
 */
export async function exampleSearchWithEnhancement() {
  console.log('=== Example 3: Search with Enhancement ===');
  
  const query = 'late night food';
  const cityName = 'Paris';
  
  // Get immediate results (non-blocking)
  const { immediateResults, enhancementPromise } = await searchWithEnhancement(
    cityName,
    query,
    {
      enableOnlineEnhancement: true,
      onEnhancementComplete: (enhancedResults) => {
        console.log('Enhanced results:', enhancedResults);
      },
    }
  );
  
  console.log(`Immediate results (${immediateResults.length}):`);
  immediateResults.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.microSituationTitle} (${r.relevanceScore} points)`);
    console.log(`     Connectivity: ${r.connectivityState}`);
  });
  
  // Wait for enhancement (optional, non-blocking)
  const enhancedResults = await enhancementPromise;
  console.log(`\nEnhanced results (${enhancedResults.length}):`);
  enhancedResults.forEach((r, i) => {
    if (r.enhanced) {
      console.log(`  ${i + 1}. ${r.microSituationTitle} ✨ ENHANCED`);
    }
  });
}

/**
 * Example 4: Immediate search (enhancement in background)
 */
export function exampleImmediateSearch() {
  console.log('=== Example 4: Immediate Search ===');
  
  const query = 'toilet';
  const cityName = 'Paris';
  
  // Get results immediately (non-blocking)
  const results = searchImmediate(cityName, query, {
    enableOnlineEnhancement: true,
    onEnhancementComplete: (enhancedResults) => {
      console.log('Results enhanced in background:', enhancedResults.length);
    },
  });
  
  console.log(`Immediate results (${results.length}):`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.microSituationTitle}`);
  });
  
  // Enhancement happens in background, doesn't block
}

/**
 * Example 5: Connectivity monitor
 */
export function exampleConnectivityMonitor() {
  console.log('=== Example 5: Connectivity Monitor ===');
  
  const monitor = getConnectivityMonitor({
    onStateChange: (state) => {
      console.log(`Connectivity changed: ${state}`);
    },
  });
  
  // Subscribe to state changes
  const unsubscribe = monitor.subscribe((state) => {
    console.log(`Monitor state: ${state}`);
  });
  
  // Start periodic monitoring
  monitor.startMonitoring(30000); // Check every 30 seconds
  
  // Get current state
  const currentState = monitor.getState();
  console.log(`Current state: ${currentState}`);
  
  // Manual check
  monitor.check().then((state) => {
    console.log(`Manual check result: ${state}`);
  });
  
  // Cleanup
  // unsubscribe();
  // monitor.dispose();
}

/**
 * Example 6: Search flow with connectivity
 */
export async function exampleSearchFlow() {
  console.log('=== Example 6: Complete Search Flow ===');
  
  const query = 'I\'m lost';
  const cityName = 'Paris';
  
  console.log(`\n1. User submits query: "${query}"`);
  
  // Step 1: Immediate offline search (non-blocking)
  console.log('\n2. Executing offline search...');
  const startTime = performance.now();
  const offlineResults = quickSearch(cityName, query, { limit: 5 });
  const searchTime = performance.now() - startTime;
  console.log(`   ✅ Search completed in ${searchTime.toFixed(2)}ms`);
  console.log(`   Results: ${offlineResults.length}`);
  
  // Step 2: Connectivity check (parallel, non-blocking)
  console.log('\n3. Checking connectivity (parallel)...');
  const { immediateState, promise: connectivityPromise } = 
    checkConnectivityNonBlocking({ timeout: 1000 });
  console.log(`   Immediate state: ${immediateState}`);
  
  // Step 3: Show results immediately
  console.log('\n4. Displaying results to user...');
  console.log(`   ✅ User sees results (no waiting)`);
  
  // Step 4: Wait for connectivity (non-blocking)
  const connectivityState = await connectivityPromise;
  console.log(`\n5. Connectivity check complete: ${connectivityState}`);
  
  // Step 5: Enhance if online
  if (connectivityState !== 'offline') {
    console.log('\n6. Enhancing results (background)...');
    // Enhancement would happen here
    console.log(`   ✅ Results enhanced (non-blocking)`);
  } else {
    console.log('\n6. Offline - no enhancement');
  }
  
  console.log('\n✅ Complete flow finished');
}

/**
 * Example 7: Timing comparison
 */
export async function exampleTimingComparison() {
  console.log('=== Example 7: Timing Comparison ===');
  
  const query = 'restaurants';
  const cityName = 'Paris';
  
  // Without connectivity check (baseline)
  console.log('\nWithout connectivity check:');
  const start1 = performance.now();
  const results1 = quickSearch(cityName, query);
  const time1 = performance.now() - start1;
  console.log(`  Search time: ${time1.toFixed(2)}ms`);
  
  // With connectivity check (non-blocking)
  console.log('\nWith connectivity check (non-blocking):');
  const start2 = performance.now();
  const results2 = quickSearch(cityName, query);
  const { immediateState } = checkConnectivityNonBlocking();
  const time2 = performance.now() - start2;
  console.log(`  Search time: ${time2.toFixed(2)}ms`);
  console.log(`  Connectivity: ${immediateState} (non-blocking)`);
  
  console.log('\n✅ Connectivity check adds 0ms blocking time');
}

// Run examples (uncomment to test)
// exampleBasicCheck();
// exampleNonBlockingCheck();
// exampleSearchWithEnhancement();
// exampleImmediateSearch();
// exampleConnectivityMonitor();
// exampleSearchFlow();
// exampleTimingComparison();
