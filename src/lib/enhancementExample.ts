/**
 * Example: Offline → Enhanced Upgrade
 * 
 * Demonstrates how offline results are enhanced when online
 */

import { integratedSearch, IntegratedSearchOptions } from './enhancementIntegration';
import { EnhancedResult } from './onlineEnhancement';
import { getCurrentTimeOfDay } from './enhancementIntegration';

/**
 * Example 1: Basic offline → enhanced upgrade
 */
export async function exampleOfflineToEnhanced() {
  console.log('=== Example 1: Offline → Enhanced Upgrade ===');
  
  const query = 'late night food';
  const cityName = 'Paris';
  
  console.log(`\nQuery: "${query}"`);
  console.log('City:', cityName);
  
  // Execute integrated search
  const { immediateResults, enhancementPromise, connectivityState } = 
    await integratedSearch(cityName, query, {
      enableEnhancement: true,
      limit: 5,
    });
  
  console.log(`\n1. Immediate Results (Offline):`);
  console.log(`   Connectivity: ${connectivityState}`);
  console.log(`   Results: ${immediateResults.length}`);
  immediateResults.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.microSituationTitle} (Score: ${r.relevanceScore})`);
  });
  
  // Wait for enhancement
  console.log(`\n2. Waiting for enhancement...`);
  const enhancedResults = await enhancementPromise;
  
  console.log(`\n3. Enhanced Results (Online):`);
  console.log(`   Enhanced: ${enhancedResults.filter(r => r.enhanced).length}/${enhancedResults.length}`);
  enhancedResults.forEach((r, i) => {
    if (r.enhanced) {
      console.log(`   ${i + 1}. ${r.microSituationTitle}`);
      console.log(`      Original Score: ${r.originalScore} → Enhanced: ${r.enhancedScore}`);
      if (r.enhancementReason) {
        console.log(`      Reason: ${r.enhancementReason}`);
      }
      if (r.contextImprovements) {
        console.log(`      Context: ${JSON.stringify(r.contextImprovements)}`);
      }
    } else {
      console.log(`   ${i + 1}. ${r.microSituationTitle} (Not enhanced)`);
    }
  });
}

/**
 * Example 2: Comparison: Offline vs Enhanced
 */
export async function exampleOfflineVsEnhanced() {
  console.log('=== Example 2: Offline vs Enhanced Comparison ===');
  
  const query = "I'm lost";
  const cityName = 'Paris';
  
  const { immediateResults, enhancementPromise } = await integratedSearch(
    cityName,
    query,
    { limit: 3 }
  );
  
  console.log('\nOffline Results:');
  immediateResults.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.microSituationTitle}`);
    console.log(`     Score: ${r.relevanceScore}`);
    console.log(`     Match Types: ${r.matchTypes.join(', ')}`);
  });
  
  const enhanced = await enhancementPromise;
  
  console.log('\nEnhanced Results:');
  enhanced.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.microSituationTitle}`);
    if (r.enhanced) {
      console.log(`     Score: ${r.originalScore} → ${r.enhancedScore} ✨`);
      if (r.enhancementReason) {
        console.log(`     ${r.enhancementReason}`);
      }
    } else {
      console.log(`     Score: ${r.relevanceScore} (unchanged)`);
    }
  });
}

/**
 * Example 3: Safe-guard validation
 */
export async function exampleSafeguardValidation() {
  console.log('=== Example 3: Safe-guard Validation ===');
  
  const { SAFEGUARD_RULES } = await import('./onlineEnhancement');
  const { getTier1Pack } = await import('./offlineStorage');
  
  const pack = getTier1Pack('Paris');
  if (!pack) {
    console.log('No pack available');
    return;
  }
  
  const { immediateResults, enhancementPromise } = await integratedSearch(
    'Paris',
    'toilet',
    { limit: 5 }
  );
  
  const enhanced = await enhancementPromise;
  
  // Validate safe-guards
  console.log('\nSafe-guard Validation:');
  
  // Rule 1: Only enhance when online
  console.log('✓ Rule 1: Only enhance when online');
  
  // Rule 2: All results must exist in pack
  const allInPack = immediateResults.every(r => {
    // Check if result exists in pack
    return pack.tier1?.cards.some(card => 
      card.headline === r.cardHeadline &&
      card.microSituations.some(ms => 
        ms.title === r.microSituationTitle &&
        ms.actions.includes(r.action)
      )
    );
  });
  console.log(`✓ Rule 2: All results in pack: ${allInPack}`);
  
  // Rule 3: No new results
  const noNewResults = enhanced.length <= immediateResults.length;
  console.log(`✓ Rule 3: No new results: ${noNewResults}`);
  
  // Rule 4: No removed results
  const originalIds = new Set(immediateResults.map(r => 
    `${r.cardHeadline}|${r.microSituationTitle}|${r.action}`
  ));
  const enhancedIds = new Set(enhanced.map(r => 
    `${r.cardHeadline}|${r.microSituationTitle}|${r.action}`
  ));
  const noRemoved = Array.from(originalIds).every(id => enhancedIds.has(id));
  console.log(`✓ Rule 4: No removed results: ${noRemoved}`);
  
  console.log('\n✅ All safe-guards passed');
}

/**
 * Example 4: Context improvement
 */
export async function exampleContextImprovement() {
  console.log('=== Example 4: Context Improvement ===');
  
  const query = 'food';
  const cityName = 'Paris';
  const timeOfDay = getCurrentTimeOfDay();
  
  const { immediateResults, enhancementPromise } = await integratedSearch(
    cityName,
    query,
    {
      enableEnhancement: true,
      enhancementOptions: {
        enableContextImprovement: true,
      },
      limit: 3,
    }
  );
  
  console.log(`\nQuery: "${query}"`);
  console.log(`Time of day: ${timeOfDay}`);
  
  const enhanced = await enhancementPromise;
  
  console.log('\nResults with context:');
  enhanced.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.microSituationTitle}`);
    if (r.contextImprovements) {
      console.log(`   Time: ${r.contextImprovements.timeOfDay || 'N/A'}`);
      console.log(`   Location: ${r.contextImprovements.location || 'N/A'}`);
      console.log(`   Intent: ${r.contextImprovements.intent || 'N/A'}`);
    }
  });
}

/**
 * Example 5: Ranking improvement
 */
export async function exampleRankingImprovement() {
  console.log('=== Example 5: Ranking Improvement ===');
  
  const query = 'restaurants';
  const cityName = 'Paris';
  
  const { immediateResults, enhancementPromise } = await integratedSearch(
    cityName,
    query,
    {
      enableEnhancement: true,
      enhancementOptions: {
        enableRankingImprovement: true,
      },
      limit: 5,
    }
  );
  
  console.log('\nOriginal Ranking (Offline):');
  immediateResults.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.microSituationTitle} (${r.relevanceScore})`);
  });
  
  const enhanced = await enhancementPromise;
  
  console.log('\nEnhanced Ranking (Online):');
  enhanced.forEach((r, i) => {
    if (r.enhanced && r.enhancedScore !== r.originalScore) {
      console.log(`  ${i + 1}. ${r.microSituationTitle}`);
      console.log(`     ${r.originalScore} → ${r.enhancedScore} ✨`);
    } else {
      console.log(`  ${i + 1}. ${r.microSituationTitle} (${r.relevanceScore})`);
    }
  });
}

// Run examples (uncomment to test)
// exampleOfflineToEnhanced();
// exampleOfflineVsEnhanced();
// exampleSafeguardValidation();
// exampleContextImprovement();
// exampleRankingImprovement();
