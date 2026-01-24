/**
 * Offline Search Engine for Travel Packs
 * 
 * Fully on-device search with:
 * - Keyword matching (fuzzy and exact)
 * - Tag matching (extracted from card headlines)
 * - Problem-based matching (microSituation titles)
 * - Time-of-day filtering
 * - Neighborhood/area filtering
 * - Ranked results with relevance scoring
 * 
 * Performance: <200ms response time
 * No cloud calls, no LLM dependency
 */

import { TravelPack, ProblemCard, MicroSituation } from './travelPacks';
import { getTier1Pack } from './offlineStorage';
import { checkTravelSignalFromTokens } from './travelSignalGuard';
import { extractQueryTokens } from './transcriptNormalizer';

export type TimeOfDay = 
  | 'early_morning'    // 5am - 9am
  | 'morning'          // 9am - 12pm
  | 'afternoon'        // 12pm - 5pm
  | 'evening'          // 5pm - 9pm
  | 'late_night'       // 9pm - 2am
  | 'night'            // 2am - 5am
  | 'anytime';

export interface SearchOptions {
  city?: string;
  timeOfDay?: TimeOfDay;
  neighborhood?: string;
  area?: string;
  tags?: string[];
  limit?: number;
  minRelevanceScore?: number; // 0-100, filter out low-relevance results
}

export interface SearchResult {
  // Content
  cardHeadline: string;
  microSituationTitle: string;
  action: string;
  whatToDoInstead?: string;
  
  // Metadata
  city: string;
  tier: number;
  
  // Search relevance
  relevanceScore: number;        // 0-100, how well it matches query
  matchTypes: string[];          // What matched: 'keyword', 'tag', 'problem', 'title', etc.
  matchedTerms: string[];        // Which terms from query matched
  
  // Context
  inferredTags: string[];
  inferredTimeOfDay?: TimeOfDay;
  inferredNeighborhood?: string;
}

/**
 * Extract tags from card headline
 * Tags are inferred from emoji, keywords, and context
 */
function extractTagsFromHeadline(headline: string): string[] {
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
  if (headlineLower.includes('food') || headlineLower.includes('eat') || headlineLower.includes('restaurant')) {
    tags.push('food', 'dining');
  }
  if (headlineLower.includes('lost') || headlineLower.includes('around') || headlineLower.includes('direction')) {
    tags.push('navigation', 'lost');
  }
  if (headlineLower.includes('time') || headlineLower.includes('free')) {
    tags.push('activities', 'time');
  }
  if (headlineLower.includes('unsafe') || headlineLower.includes('off') || headlineLower.includes('danger')) {
    tags.push('safety', 'emergency');
  }
  if (headlineLower.includes('say') || headlineLower.includes('language') || headlineLower.includes('communicate')) {
    tags.push('language', 'communication');
  }
  if (headlineLower.includes('tired') || headlineLower.includes('overwhelmed') || headlineLower.includes('rest')) {
    tags.push('wellbeing', 'rest');
  }
  
  // Remove duplicates
  return Array.from(new Set(tags));
}

/**
 * Infer time of day from content
 */
function inferTimeOfDay(content: string): TimeOfDay | undefined {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('late night') || 
      contentLower.includes('midnight') || 
      contentLower.includes('after 10') ||
      contentLower.includes('after hours') ||
      contentLower.includes('2am') ||
      contentLower.includes('1am')) {
    return 'late_night';
  }
  
  if (contentLower.includes('morning') || 
      contentLower.includes('breakfast') || 
      contentLower.includes('early') ||
      contentLower.includes('5am') ||
      contentLower.includes('6am') ||
      contentLower.includes('7am')) {
    return 'morning';
  }
  
  if (contentLower.includes('lunch') || 
      contentLower.includes('afternoon') ||
      contentLower.includes('12pm') ||
      contentLower.includes('1pm') ||
      contentLower.includes('2pm')) {
    return 'afternoon';
  }
  
  if (contentLower.includes('dinner') || 
      contentLower.includes('evening') ||
      contentLower.includes('7pm') ||
      contentLower.includes('8pm') ||
      contentLower.includes('9pm')) {
    return 'evening';
  }
  
  return undefined;
}

/**
 * Extract neighborhood/area from content
 */
function extractNeighborhood(content: string): string | undefined {
  // Common Paris neighborhoods
  const parisNeighborhoods = [
    'le marais', 'marais', 'montmartre', 'latin quarter', 'champs-élysées',
    'bastille', 'belleville', 'canal saint-martin', 'gare du nord', 'gare de lyon',
    'invalides', 'tuileries', 'notre-dame', 'eiffel tower', 'louvre',
    'rue cler', 'rue de rivoli', 'rue des rosiers', 'rue mouffetard'
  ];
  
  const contentLower = content.toLowerCase();
  for (const neighborhood of parisNeighborhoods) {
    if (contentLower.includes(neighborhood)) {
      return neighborhood;
    }
  }
  
  return undefined;
}

/**
 * Calculate relevance score for a search result
 */
function calculateRelevanceScore(
  queryTerms: string[],
  card: ProblemCard,
  microSituation: MicroSituation,
  action: string,
  options: SearchOptions
): { score: number; matchTypes: string[]; matchedTerms: string[] } {
  let score = 0;
  const matchTypes: string[] = [];
  const matchedTerms: string[] = [];
  
  const headlineLower = card.headline.toLowerCase();
  const microTitleLower = microSituation.title.toLowerCase();
  const actionLower = action.toLowerCase();
  const whatToDoLower = microSituation.whatToDoInstead?.toLowerCase() || '';
  
  // Extract tags for tag matching
  const tags = extractTagsFromHeadline(card.headline);
  
  // Check each query term
  for (const term of queryTerms) {
    let termMatched = false;
    
    // Exact match in action (highest weight: 30 points)
    if (actionLower.includes(term)) {
      score += 30;
      matchTypes.push('keyword-action');
      matchedTerms.push(term);
      termMatched = true;
    }
    
    // Exact match in microSituation title (high weight: 25 points)
    if (microTitleLower.includes(term)) {
      score += 25;
      if (!matchTypes.includes('problem')) matchTypes.push('problem');
      matchedTerms.push(term);
      termMatched = true;
    }
    
    // Exact match in card headline (high weight: 20 points)
    if (headlineLower.includes(term)) {
      score += 20;
      if (!matchTypes.includes('tag')) matchTypes.push('tag');
      matchedTerms.push(term);
      termMatched = true;
    }
    
    // Tag match (medium weight: 15 points per matching tag)
    const matchingTags = tags.filter(tag => tag.includes(term) || term.includes(tag));
    if (matchingTags.length > 0) {
      score += 15 * matchingTags.length;
      if (!matchTypes.includes('tag')) matchTypes.push('tag');
      matchedTerms.push(...matchingTags);
      termMatched = true;
    }
    
    // Match in whatToDoInstead (medium weight: 15 points)
    if (whatToDoLower.includes(term)) {
      score += 15;
      if (!matchTypes.includes('advice')) matchTypes.push('advice');
      matchedTerms.push(term);
      termMatched = true;
    }
    
    // Partial word match (lower weight: 5 points)
    if (!termMatched) {
      const words = actionLower.split(/\s+/);
      const matchingWords = words.filter(word => word.includes(term) || term.includes(word));
      if (matchingWords.length > 0) {
        score += 5 * matchingWords.length;
        matchedTerms.push(...matchingWords);
      }
    }
  }
  
  // Boost for multiple term matches
  if (matchedTerms.length > 1) {
    score += 10 * (matchedTerms.length - 1);
  }
  
  // Time-of-day relevance boost/penalty
  if (options.timeOfDay) {
    const inferredTime = inferTimeOfDay(action + ' ' + microSituation.title);
    if (inferredTime === options.timeOfDay || inferredTime === undefined) {
      score += 10; // Boost if time matches or no time specified
    } else {
      score -= 5; // Small penalty if time doesn't match
    }
  }
  
  // Neighborhood/area relevance boost
  if (options.neighborhood || options.area) {
    const inferredNeighborhood = extractNeighborhood(action + ' ' + microSituation.title);
    const searchLocation = (options.neighborhood || options.area || '').toLowerCase();
    if (inferredNeighborhood && searchLocation.includes(inferredNeighborhood)) {
      score += 15; // Boost for location match
      if (!matchTypes.includes('location')) matchTypes.push('location');
    }
  }
  
  // Tag filter boost
  if (options.tags && options.tags.length > 0) {
    const matchingFilterTags = tags.filter(tag => 
      options.tags!.some(filterTag => tag.includes(filterTag) || filterTag.includes(tag))
    );
    if (matchingFilterTags.length > 0) {
      score += 10 * matchingFilterTags.length;
      if (!matchTypes.includes('tag-filter')) matchTypes.push('tag-filter');
    }
  }
  
  // Cap score at 100
  score = Math.min(100, score);
  
  return { score, matchTypes: Array.from(new Set(matchTypes)), matchedTerms: Array.from(new Set(matchedTerms)) };
}

/**
 * Offline Search Engine Class
 */
export class OfflineSearchEngine {
  private pack: TravelPack | null = null;
  private city: string = '';
  
  /**
   * Initialize search engine with a travel pack
   */
  initialize(cityName: string): boolean {
    const tier1Pack = getTier1Pack(cityName);
    if (!tier1Pack || !tier1Pack.tier1) {
      return false;
    }
    
    // Reconstruct full pack structure from tier1
    this.pack = {
      city: tier1Pack.city,
      country: tier1Pack.country,
      tiers: {
        tier1: tier1Pack.tier1
      }
    };
    this.city = tier1Pack.city;
    return true;
  }
  
  /**
   * Search travel pack content
   * 
   * @param query - Plain text query (from voice or keyboard)
   * @param options - Search filters and options
   * @returns Ranked search results
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const startTime = performance.now();
    
    if (!this.pack || !this.pack.tiers.tier1) {
      return [];
    }
    
    const queryTrimmed = query.trim();
    if (!queryTrimmed) {
      return [];
    }
    
    // Stop-word removal first; guard runs on the resulting tokens.
    const queryTerms = extractQueryTokens(queryTrimmed);
    if (queryTerms.length === 0) {
      return [];
    }
    
    // Travel-signal guard: short-circuit if no token matches TRAVEL_KEYWORDS.
    // Why: avoid "no results found" for non-travel queries. Does not throw; does not block offline.
    const guard = checkTravelSignalFromTokens(queryTerms);
    if (guard.type === 'no_signal') {
      return [];
    }
    
    // Use city from options or default to initialized city
    const searchCity = options.city || this.city;
    if (searchCity.toLowerCase() !== this.pack.city.toLowerCase()) {
      return [];
    }
    
    // Search through all cards, microSituations, and actions
    const results: SearchResult[] = [];
    const seenResults = new Set<string>(); // For deduplication
    
    this.pack.tiers.tier1.cards.forEach((card) => {
      card.microSituations.forEach((microSituation) => {
        microSituation.actions.forEach((action) => {
          // Calculate relevance
          const { score, matchTypes, matchedTerms } = calculateRelevanceScore(
            queryTerms,
            card,
            microSituation,
            action,
            options
          );
          
          // Filter by minimum relevance score
          if (options.minRelevanceScore && score < options.minRelevanceScore) {
            return;
          }
          
          // Only include results with some relevance
          if (score > 0) {
            // Create unique key for deduplication
            const resultKey = `${card.headline}|${microSituation.title}|${action}`;
            
            if (!seenResults.has(resultKey)) {
              seenResults.add(resultKey);
              
              const inferredTags = extractTagsFromHeadline(card.headline);
              const inferredTime = inferTimeOfDay(action + ' ' + microSituation.title);
              const inferredNeighborhood = extractNeighborhood(action + ' ' + microSituation.title);
              
              results.push({
                cardHeadline: card.headline,
                microSituationTitle: microSituation.title,
                action,
                whatToDoInstead: microSituation.whatToDoInstead,
                city: this.pack!.city,
                tier: 1,
                relevanceScore: score,
                matchTypes,
                matchedTerms,
                inferredTags,
                inferredTimeOfDay: inferredTime,
                inferredNeighborhood
              });
            }
          }
        });
      });
    });
    
    // Sort by relevance score (descending)
    results.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Tie-breaker: prefer matches in titles over actions
      const aTitleMatch = a.matchTypes.includes('problem') || a.matchTypes.includes('tag');
      const bTitleMatch = b.matchTypes.includes('problem') || b.matchTypes.includes('tag');
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });
    
    // Apply limit
    const limit = options.limit || 20;
    const limitedResults = results.slice(0, limit);
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    // Log performance (can be removed in production)
    if (searchTime > 200) {
      console.warn(`Search took ${searchTime.toFixed(2)}ms (target: <200ms)`);
    }
    
    return limitedResults;
  }
  
  /**
   * Get current time of day
   */
  getCurrentTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 9) return 'early_morning';
    if (hour >= 9 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 2) return 'late_night';
    return 'night';
  }
  
  /**
   * Search with automatic time-of-day detection
   */
  searchWithAutoTime(query: string, options: Omit<SearchOptions, 'timeOfDay'> & { autoTime?: boolean } = {}): SearchResult[] {
    const timeOfDay = options.autoTime ? this.getCurrentTimeOfDay() : undefined;
    return this.search(query, { ...options, timeOfDay });
  }
}

/**
 * Singleton instance for easy access
 */
let searchEngineInstance: OfflineSearchEngine | null = null;

/**
 * Get or create search engine instance
 */
export function getSearchEngine(cityName: string): OfflineSearchEngine | null {
  if (!searchEngineInstance) {
    searchEngineInstance = new OfflineSearchEngine();
  }
  
  if (searchEngineInstance.initialize(cityName)) {
    return searchEngineInstance;
  }
  
  return null;
}

/**
 * Convenience function for quick searches
 */
export function quickSearch(cityName: string, query: string, options?: SearchOptions): SearchResult[] {
  const engine = getSearchEngine(cityName);
  if (!engine) {
    return [];
  }
  return engine.search(query, options);
}
