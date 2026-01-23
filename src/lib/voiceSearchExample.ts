/**
 * Example Usage of Voice Search for Offline-First Travel Packs
 * 
 * Demonstrates how to use the voice search functionality with example queries
 */

import { searchVoiceQuery, getCurrentTimeOfDay, getEntriesByUrgency } from './voiceSearch';
import { OfflineFirstTravelPack, VoiceSearchQuery } from './offlineFirstSchema';

// Example: Load the offline-first pack (in real app, load from JSON file)
const examplePack: OfflineFirstTravelPack = {
  city: "Paris",
  country: "France",
  version: "1.0.0",
  last_updated: "2026-01-23T00:00:00Z",
  entries: [
    {
      id: "paris-late-night-food-001",
      title: "Late Night Food Options After 10pm",
      content: "Most Parisian restaurants close by 10pm, but you have options...",
      problem_it_solves: "Finding food when restaurants are closed late at night",
      tags: ["food", "late-night", "restaurants", "budget", "emergency"],
      time_of_day: ["late_night", "night"],
      neighborhood: "City-wide",
      area: "Multiple areas",
      spoken_phrases: [
        "I'm hungry late at night",
        "Where can I eat after midnight",
        "Restaurants open late"
      ],
      keywords: ["late night", "midnight", "after hours", "24 hour", "open late"],
      urgency: "urgent",
      priority_score: 85,
      city: "Paris",
      country: "France",
      version: "1.0.0"
    }
    // ... more entries
  ]
};

/**
 * Example 1: Basic voice search
 */
export function exampleBasicVoiceSearch() {
  const query: VoiceSearchQuery = {
    query: "I'm hungry late at night",
    city: "Paris",
    limit: 5
  };
  
  const results = searchVoiceQuery(examplePack, query);
  
  console.log(`Found ${results.length} results for: "${query.query}"`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.entry.title}`);
    console.log(`   Relevance: ${result.relevance_score}/100`);
    console.log(`   Match reasons: ${result.match_reason.join(', ')}`);
    console.log(`   Content: ${result.entry.content.substring(0, 100)}...`);
  });
}

/**
 * Example 2: Voice search with time-of-day filtering
 */
export function exampleTimeFilteredSearch() {
  const currentTime = getCurrentTimeOfDay();
  
  const query: VoiceSearchQuery = {
    query: "where can I eat",
    city: "Paris",
    time_of_day: currentTime, // Automatically filter by current time
    limit: 3
  };
  
  const results = searchVoiceQuery(examplePack, query);
  
  console.log(`Current time: ${currentTime}`);
  console.log(`Found ${results.length} time-relevant results`);
}

/**
 * Example 3: Emergency search (highest urgency)
 */
export function exampleEmergencySearch() {
  const query: VoiceSearchQuery = {
    query: "I feel unsafe",
    city: "Paris",
    urgency_filter: "emergency",
    limit: 5
  };
  
  const results = searchVoiceQuery(examplePack, query);
  
  console.log("Emergency results (sorted by urgency):");
  results.forEach(result => {
    console.log(`- ${result.entry.title} (${result.entry.urgency})`);
  });
}

/**
 * Example 4: Location-based search
 */
export function exampleLocationSearch() {
  const query: VoiceSearchQuery = {
    query: "restaurants",
    city: "Paris",
    location: "Le Marais", // Filter by neighborhood
    limit: 5
  };
  
  const results = searchVoiceQuery(examplePack, query);
  
  console.log(`Results for ${query.location}:`);
  results.forEach(result => {
    console.log(`- ${result.entry.title} (${result.entry.neighborhood || result.entry.area})`);
  });
}

/**
 * Example 5: Get all emergency entries (no search query)
 */
export function exampleGetEmergencyEntries() {
  const emergencyEntries = getEntriesByUrgency(examplePack, "emergency", 10);
  
  console.log(`Found ${emergencyEntries.length} emergency entries:`);
  emergencyEntries.forEach(entry => {
    console.log(`- ${entry.title}`);
    console.log(`  Problem: ${entry.problem_it_solves}`);
  });
}

/**
 * Example 6: Natural language variations
 * Shows how the search handles different ways of asking the same question
 */
export function exampleNaturalLanguageVariations() {
  const variations = [
    "I'm hungry late at night",
    "Where can I eat after midnight",
    "Food after 10pm",
    "Late night dining",
    "Restaurants open late",
    "I need food it's late"
  ];
  
  variations.forEach(queryText => {
    const results = searchVoiceQuery(examplePack, {
      query: queryText,
      city: "Paris",
      limit: 1
    });
    
    if (results.length > 0) {
      console.log(`"${queryText}" → ${results[0].entry.title} (score: ${results[0].relevance_score})`);
    }
  });
}

/**
 * Example 7: Combined filters
 */
export function exampleCombinedFilters() {
  const query: VoiceSearchQuery = {
    query: "food",
    city: "Paris",
    time_of_day: "late_night",
    urgency_filter: "urgent",
    location: "City-wide",
    limit: 5
  };
  
  const results = searchVoiceQuery(examplePack, query);
  
  console.log("Combined filter results:");
  console.log(`- Time: ${query.time_of_day}`);
  console.log(`- Urgency: ${query.urgency_filter}`);
  console.log(`- Location: ${query.location}`);
  console.log(`\nFound ${results.length} matching entries`);
}

// Run examples (uncomment to test)
// exampleBasicVoiceSearch();
// exampleTimeFilteredSearch();
// exampleEmergencySearch();
// exampleLocationSearch();
// exampleGetEmergencyEntries();
// exampleNaturalLanguageVariations();
// exampleCombinedFilters();
