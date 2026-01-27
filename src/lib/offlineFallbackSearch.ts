/**
 * Guaranteed Offline Fallback Search
 * 
 * Core Principles:
 * - Always uses local pack data (never requires network)
 * - Never shows empty state unless no matching content exists
 * - Uses spoken_phrases + tags to improve relevance
 * - Provides positive user feedback (no error tone)
 * 
 * Matching Priority Order:
 * 1. Spoken phrases (exact match)
 * 2. Spoken phrases (partial match)
 * 3. Tags (exact match)
 * 4. Tags (partial match)
 * 5. Keywords (exact match)
 * 6. Keywords (partial match)
 * 7. Title/content (fuzzy match)
 */

import { TravelPack, ProblemCard, MicroSituation } from '@/types/travel';
import { getTier1Pack } from './offlineStorage';
import { ConnectivityState } from './connectivity';
import { checkTravelSignal, TravelSignalGuardResult } from './travelSignalGuard';
import { extractSearchIntent, normalizeTranscript, extractQueryTokens } from './transcriptNormalizer';

export type SearchState = 
  | 'local_results'        // Showing results from local pack
  | 'no_results';          // No matching content (only if truly no matches)

export interface FallbackSearchResult {
  // Content
  cardHeadline: string;
  microSituationTitle: string;
  action: string;
  whatToDoInstead?: string;
  
  // Metadata
  city: string;
  tier: number;
  
  // Search relevance
  relevanceScore: number;        // 0-100
  matchTypes: string[];          // Priority match types
  matchedTerms: string[];        // Which terms matched
  
  // Match priority (lower = higher priority)
  matchPriority: number;         // 1-7 based on matching priority order
}

export interface FallbackSearchOptions {
  city?: string;
  minRelevanceScore?: number;
  limit?: number;
  connectivityState?: ConnectivityState; // For UX messaging
}

/**
 * Extract spoken phrases from microSituation
 * Generates natural language variations
 */
function extractSpokenPhrases(
  card: ProblemCard,
  microSituation: MicroSituation
): string[] {
  const phrases: string[] = [];
  
  // Use microSituation title as base phrase
  phrases.push(microSituation.title.toLowerCase());
  
  // Generate variations from card headline
  const headline = card.headline.toLowerCase();
  
  if (headline.includes('food') || headline.includes('🍽')) {
    phrases.push("i'm hungry");
    phrases.push("where can i eat");
    phrases.push("i need food");
    phrases.push("food nearby");
    phrases.push("restaurants");
  }
  
  if (headline.includes('lost') || headline.includes('🧭')) {
    phrases.push("i'm lost");
    phrases.push("how do i get around");
    phrases.push("i need directions");
    phrases.push("where am i");
  }
  
  if (headline.includes('time') || headline.includes('⏱')) {
    phrases.push("what should i do");
    phrases.push("i have free time");
    phrases.push("what's nearby");
  }
  
  if (headline.includes('unsafe') || headline.includes('😬')) {
    phrases.push("i feel unsafe");
    phrases.push("is this area safe");
    phrases.push("i need help");
    phrases.push("emergency");
  }
  
  if (headline.includes('say') || headline.includes('🗣')) {
    phrases.push("i don't know what to say");
    phrases.push("how do i communicate");
    phrases.push("language help");
  }
  
  if (headline.includes('tired') || headline.includes('💤')) {
    phrases.push("i'm tired");
    phrases.push("i need to rest");
    phrases.push("i'm overwhelmed");
  }
  
  // Add microSituation-specific phrases
  const microTitle = microSituation.title.toLowerCase();
  if (microTitle.includes('late night') || microTitle.includes('midnight')) {
    phrases.push("late night food");
    phrases.push("food after midnight");
    phrases.push("restaurants open late");
  }
  
  return Array.from(new Set(phrases));
}

/**
 * Extract tags from card headline
 */
function extractTags(headline: string): string[] {
  const tags: string[] = [];
  const headlineLower = headline.toLowerCase();
  
  // Emoji-based tags
  if (headline.includes('🧭')) tags.push('navigation', 'getting-around', 'lost');
  if (headline.includes('🍽')) tags.push('food', 'restaurants', 'dining');
  if (headline.includes('⏱')) tags.push('activities', 'time-management', 'free-time');
  if (headline.includes('😬')) tags.push('safety', 'emergency', 'concern');
  if (headline.includes('🗣')) tags.push('language', 'communication');
  if (headline.includes('💤')) tags.push('wellbeing', 'rest', 'tired');
  if (headline.includes('🎲')) tags.push('spontaneity', 'discovery');
  
  // Keyword-based tags
  if (headlineLower.includes('food') || headlineLower.includes('eat')) {
    tags.push('food', 'dining');
  }
  if (headlineLower.includes('lost') || headlineLower.includes('around')) {
    tags.push('navigation', 'lost');
  }
  if (headlineLower.includes('time') || headlineLower.includes('free')) {
    tags.push('activities', 'time');
  }
  if (headlineLower.includes('unsafe') || headlineLower.includes('danger')) {
    tags.push('safety', 'emergency');
  }
  
  return Array.from(new Set(tags));
}

/**
 * Extract keywords from content
 */
function extractKeywords(
  card: ProblemCard,
  microSituation: MicroSituation,
  action: string
): string[] {
  const keywords = new Set<string>();
  
  // Extract from actions
  action.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['the', 'and', 'for', 'with', 'from'].includes(w))
    .forEach(word => keywords.add(word));
  
  // Add common synonyms
  const titleLower = microSituation.title.toLowerCase();
  if (titleLower.includes('food')) {
    keywords.add('restaurant');
    keywords.add('dining');
    keywords.add('meal');
  }
  if (titleLower.includes('lost')) {
    keywords.add('navigation');
    keywords.add('directions');
    keywords.add('map');
  }
  
  return Array.from(keywords);
}

/**
 * Calculate match priority and score
 * Lower priority number = higher priority match
 */
function calculateMatchPriority(
  queryTerms: string[],
  card: ProblemCard,
  microSituation: MicroSituation,
  action: string
): { priority: number; score: number; matchTypes: string[]; matchedTerms: string[] } {
  const queryLower = queryTerms.join(' ').toLowerCase();
  const spokenPhrases = extractSpokenPhrases(card, microSituation);
  const tags = extractTags(card.headline);
  const keywords = extractKeywords(card, microSituation, action);
  
  let priority = 999; // High number = low priority
  let score = 0;
  const matchTypes: string[] = [];
  const matchedTerms: string[] = [];
  
  // Priority 1: Spoken phrases (exact match)
  for (const phrase of spokenPhrases) {
    if (phrase === queryLower) {
      priority = Math.min(priority, 1);
      score += 50;
      matchTypes.push('spoken-phrase-exact');
      matchedTerms.push(phrase);
      break;
    }
  }
  
  // Priority 2: Spoken phrases (partial match)
  if (priority > 2) {
    for (const phrase of spokenPhrases) {
      if (phrase.includes(queryLower) || queryLower.includes(phrase)) {
        priority = Math.min(priority, 2);
        score += 40;
        matchTypes.push('spoken-phrase-partial');
        matchedTerms.push(phrase);
        break;
      }
    }
  }
  
  // Priority 3: Tags (exact match)
  if (priority > 3) {
    for (const tag of tags) {
      if (queryTerms.some(term => tag === term.toLowerCase())) {
        priority = Math.min(priority, 3);
        score += 35;
        matchTypes.push('tag-exact');
        matchedTerms.push(tag);
        break;
      }
    }
  }
  
  // Priority 4: Tags (partial match)
  if (priority > 4) {
    for (const tag of tags) {
      if (queryTerms.some(term => tag.includes(term.toLowerCase()) || term.toLowerCase().includes(tag))) {
        priority = Math.min(priority, 4);
        score += 30;
        matchTypes.push('tag-partial');
        matchedTerms.push(tag);
        break;
      }
    }
  }
  
  // Priority 5: Keywords (exact match)
  if (priority > 5) {
    for (const keyword of keywords) {
      if (queryTerms.some(term => keyword === term.toLowerCase())) {
        priority = Math.min(priority, 5);
        score += 25;
        matchTypes.push('keyword-exact');
        matchedTerms.push(keyword);
        break;
      }
    }
  }
  
  // Priority 6: Keywords (partial match)
  if (priority > 6) {
    for (const keyword of keywords) {
      if (queryTerms.some(term => keyword.includes(term.toLowerCase()) || term.toLowerCase().includes(keyword))) {
        priority = Math.min(priority, 6);
        score += 20;
        matchTypes.push('keyword-partial');
        matchedTerms.push(keyword);
        break;
      }
    }
  }
  
  // Priority 7: Title/content (fuzzy match)
  if (priority > 7) {
    const titleLower = microSituation.title.toLowerCase();
    const actionLower = action.toLowerCase();
    const headlineLower = card.headline.toLowerCase();
    
    const titleMatches = queryTerms.filter(term => titleLower.includes(term.toLowerCase())).length;
    const actionMatches = queryTerms.filter(term => actionLower.includes(term.toLowerCase())).length;
    const headlineMatches = queryTerms.filter(term => headlineLower.includes(term.toLowerCase())).length;
    
    if (titleMatches > 0 || actionMatches > 0 || headlineMatches > 0) {
      priority = 7;
      score += (titleMatches * 10) + (actionMatches * 5) + (headlineMatches * 5);
      matchTypes.push('content-fuzzy');
      matchedTerms.push(...queryTerms.filter(term => 
        titleLower.includes(term.toLowerCase()) || 
        actionLower.includes(term.toLowerCase()) ||
        headlineLower.includes(term.toLowerCase())
      ));
    }
  }
  
  // Boost score for multiple term matches
  if (matchedTerms.length > 1) {
    score += matchedTerms.length * 5;
  }
  
  // If no match found, return low priority
  if (priority === 999) {
    return { priority: 999, score: 0, matchTypes: [], matchedTerms: [] };
  }
  
  return { priority, score: Math.min(100, score), matchTypes, matchedTerms };
}

/**
 * Guaranteed offline fallback search
 * Always returns results from local pack, never shows empty unless truly no matches
 */
export function fallbackSearch(
  cityName: string,
  query: string,
  options: FallbackSearchOptions = {}
): {
  results: FallbackSearchResult[];
  state: SearchState;
  message: string;
} {
  // SANITY CHECK: Verify function is being called
  console.log("fallbackSearch called with:", { cityName, query });
  
  // SANITY CHECK: Verify transcript is a real string
  console.log("Voice transcript:", query);
  console.log("Transcript type:", typeof query);
  console.log("Transcript length:", query?.length);
  
  // Normalize transcript: remove filler words and clean
  const normalizedQuery = extractSearchIntent(query);
  console.log("Normalized query:", normalizedQuery);
  
  const { minRelevanceScore = 5, limit = 20, connectivityState } = options;
  
  // Get offline pack
  const tier1Pack = getTier1Pack(cityName);
  
  // SANITY CHECK: Verify JSON is actually loaded offline
  if (tier1Pack && tier1Pack.tier1) {
    const totalCards = tier1Pack.tier1.cards.length;
    const totalMicroSituations = tier1Pack.tier1.cards.reduce((sum, card) => sum + card.microSituations.length, 0);
    const totalActions = tier1Pack.tier1.cards.reduce((sum, card) => 
      sum + card.microSituations.reduce((msSum, ms) => msSum + ms.actions.length, 0), 0
    );
    console.log("Pack entries:", {
      cards: totalCards,
      microSituations: totalMicroSituations,
      actions: totalActions,
      totalSearchable: totalActions
    });
  } else {
    console.log("Pack entries: 0 (pack not loaded)");
  }
  
  if (!tier1Pack || !tier1Pack.tier1) {
    return {
      results: [],
      state: 'no_results',
      message: 'No pack available for this city',
    };
  }
  
  // Step 2: Only search if tokens remain after normalization
  const tokens = extractQueryTokens(query);
  console.log("Query tokens:", tokens);
  
  if (tokens.length === 0) {
    console.log("No tokens remaining after normalization, showing voice hint");
    return {
      results: [],
      state: 'no_results',
      message: 'Try asking about food, places, or things to do nearby.',
    };
  }
  
  // Use normalized query, fallback to original
  const queryToUse = normalizedQuery || query;
  const queryTrimmed = queryToUse.trim().toLowerCase();
  
  if (!queryTrimmed) {
    return {
      results: [],
      state: 'no_results',
      message: 'Please enter a search query',
    };
  }
  
  // Step C: Check travel signal before searching (use normalized query)
  const signalCheck = checkTravelSignal(queryTrimmed);
  if (signalCheck.type === 'fallback') {
    console.log("No travel signal detected, returning fallback suggestions");
    return {
      results: (signalCheck.results || []).map((suggestion, index) => ({
        cardHeadline: suggestion.cardHeadline,
        microSituationTitle: suggestion.microSituationTitle,
        action: suggestion.action,
        city: cityName,
        tier: 1,
        relevanceScore: 0,
        matchTypes: ['fallback-suggestion'],
        matchedTerms: [],
        matchPriority: 999,
      })),
      state: 'local_results',
      message: signalCheck.message || 'Try asking about food, places, or things to do nearby.',
    };
  }
  
  // Tokenize query (already normalized, but filter again for safety)
  const queryTerms = queryTrimmed
    .split(/\s+/)
    .filter(term => term.length > 1)
    .filter(term => !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from'].includes(term));
  
  if (queryTerms.length === 0) {
    return {
      results: [],
      state: 'no_results',
      message: 'Please enter a search query',
    };
  }
  
  // Search through all content
  const allResults: FallbackSearchResult[] = [];
  const seenResults = new Set<string>();
  
  tier1Pack.tier1.cards.forEach((card) => {
    card.microSituations.forEach((microSituation) => {
      microSituation.actions.forEach((action) => {
        const { priority, score, matchTypes, matchedTerms } = calculateMatchPriority(
          queryTerms,
          card,
          microSituation,
          action
        );
        
        // Only include if has some relevance
        if (score >= minRelevanceScore) {
          const resultKey = `${card.headline}|${microSituation.title}|${action}`;
          
          if (!seenResults.has(resultKey)) {
            seenResults.add(resultKey);
            
            allResults.push({
              cardHeadline: card.headline,
              microSituationTitle: microSituation.title,
              action,
              whatToDoInstead: microSituation.whatToDoInstead,
              city: tier1Pack.city,
              tier: 1,
              relevanceScore: score,
              matchTypes,
              matchedTerms,
              matchPriority: priority,
            });
          }
        }
      });
    });
  });
  
  // Sort by priority (lower = better), then by score
  allResults.sort((a, b) => {
    if (a.matchPriority !== b.matchPriority) {
      return a.matchPriority - b.matchPriority;
    }
    return b.relevanceScore - a.relevanceScore;
  });
  
  // Apply limit
  const limitedResults = allResults.slice(0, limit);
  
  // Determine state and message
  const state: SearchState = limitedResults.length > 0 ? 'local_results' : 'no_results';
  
  let message: string;
  if (state === 'local_results') {
    if (connectivityState === 'offline' || connectivityState === 'poor') {
      message = 'Showing results from your downloaded pack';
    } else {
      message = `Found ${limitedResults.length} result${limitedResults.length !== 1 ? 's' : ''} in your pack`;
    }
  } else {
    message = 'No matching content found. Try different keywords or browse the pack categories.';
  }
  
  return {
    results: limitedResults,
    state,
    message,
  };
}

/**
 * Get UX state definition
 */
export function getSearchUXState(
  state: SearchState,
  resultsCount: number,
  connectivityState?: ConnectivityState
): {
  message: string;
  tone: 'positive' | 'neutral' | 'helpful';
  showEmptyState: boolean;
} {
  if (state === 'local_results') {
    if (connectivityState === 'offline' || connectivityState === 'poor') {
      return {
        message: 'Showing results from your downloaded pack',
        tone: 'positive',
        showEmptyState: false,
      };
    }
    
    return {
      message: `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''} in your pack`,
      tone: 'positive',
      showEmptyState: false,
    };
  }
  
  // No results - only show empty state if truly no matches
  return {
    message: 'No matching content found. Try different keywords or browse the pack categories.',
    tone: 'helpful',
    showEmptyState: true,
  };
}
