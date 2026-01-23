/**
 * Voice-Optimized Search for Offline-First Travel Packs
 * 
 * Implements fast local search optimized for voice queries
 * - Fuzzy matching on spoken phrases and keywords
 * - Time-of-day filtering
 * - Urgency-based ranking
 * - Neighborhood/area filtering
 * 
 * Works entirely offline using pre-loaded JSON data
 */

import { 
  OfflineFirstPackEntry, 
  OfflineFirstTravelPack,
  VoiceSearchQuery,
  VoiceSearchResult,
  TimeOfDay,
  UrgencyLevel
} from './offlineFirstSchema';

/**
 * Calculate relevance score for a search result
 * Higher score = better match
 */
function calculateRelevanceScore(
  entry: OfflineFirstPackEntry,
  query: string,
  queryLower: string,
  timeOfDay?: TimeOfDay,
  location?: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const titleLower = entry.title.toLowerCase();
  const contentLower = entry.content.toLowerCase();
  const problemLower = entry.problem_it_solves.toLowerCase();

  // Exact phrase match in spoken phrases (highest weight)
  const spokenMatch = entry.spoken_phrases.some(phrase => {
    const phraseLower = phrase.toLowerCase();
    return phraseLower === queryLower || phraseLower.includes(queryLower) || queryLower.includes(phraseLower);
  });
  if (spokenMatch) {
    score += 50;
    reasons.push('Matches spoken phrase');
  }

  // Keyword match (high weight)
  const keywordMatch = entry.keywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return keywordLower === queryLower || keywordLower.includes(queryLower) || queryLower.includes(keywordLower);
  });
  if (keywordMatch) {
    score += 40;
    reasons.push('Matches keyword');
  }

  // Title match (medium-high weight)
  if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
    score += 30;
    reasons.push('Matches title');
  }

  // Problem match (medium weight)
  if (problemLower.includes(queryLower) || queryLower.includes(problemLower)) {
    score += 25;
    reasons.push('Matches problem description');
  }

  // Content match (lower weight, but still valuable)
  const contentWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const contentMatches = contentWords.filter(word => contentLower.includes(word)).length;
  if (contentMatches > 0) {
    score += contentMatches * 5;
    reasons.push(`Matches ${contentMatches} content words`);
  }

  // Tag match (medium weight)
  const tagMatches = entry.tags.filter(tag => 
    tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
  ).length;
  if (tagMatches > 0) {
    score += tagMatches * 10;
    reasons.push(`Matches ${tagMatches} tags`);
  }

  // Time-of-day relevance boost
  if (timeOfDay) {
    if (entry.time_of_day.includes(timeOfDay) || entry.time_of_day.includes('anytime')) {
      score += 20;
      reasons.push(`Relevant for ${timeOfDay}`);
    } else {
      score -= 10; // Penalize if not relevant for current time
      reasons.push(`Not relevant for ${timeOfDay}`);
    }
  }

  // Location relevance boost
  if (location) {
    const locationLower = location.toLowerCase();
    if (entry.neighborhood?.toLowerCase().includes(locationLower) || 
        entry.area?.toLowerCase().includes(locationLower)) {
      score += 15;
      reasons.push(`Matches location: ${location}`);
    }
  }

  // Urgency boost (emergency entries rank higher)
  const urgencyScores: Record<UrgencyLevel, number> = {
    emergency: 25,
    urgent: 15,
    important: 5,
    helpful: 0
  };
  score += urgencyScores[entry.urgency];
  reasons.push(`Urgency: ${entry.urgency}`);

  // Priority score boost (from entry metadata)
  score += entry.priority_score * 0.1;

  return { score: Math.min(100, score), reasons };
}

/**
 * Fuzzy string matching using Levenshtein-like approach
 * Simple implementation for offline use
 */
function fuzzyMatch(str1: string, str2: string, threshold: number = 0.7): boolean {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Word-level matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const matchingWords = words1.filter(w1 => 
    words2.some(w2 => w1.includes(w2) || w2.includes(w1))
  ).length;
  
  const similarity = matchingWords / Math.max(words1.length, words2.length);
  return similarity >= threshold;
}

/**
 * Search offline-first travel pack entries using voice query
 * 
 * @param pack - The offline-first travel pack to search
 * @param query - Voice search query
 * @returns Array of search results sorted by relevance
 */
export function searchVoiceQuery(
  pack: OfflineFirstTravelPack,
  query: VoiceSearchQuery
): VoiceSearchResult[] {
  const { query: queryText, city, time_of_day, location, urgency_filter, limit = 10 } = query;
  
  // Validate city match
  if (pack.city.toLowerCase() !== city.toLowerCase()) {
    return [];
  }

  const queryLower = queryText.toLowerCase().trim();
  if (!queryLower) {
    return [];
  }

  // Filter entries
  let candidates = pack.entries;

  // Filter by urgency if specified
  if (urgency_filter) {
    candidates = candidates.filter(e => e.urgency === urgency_filter);
  }

  // Filter by time of day if specified
  if (time_of_day) {
    candidates = candidates.filter(e => 
      e.time_of_day.includes(time_of_day) || e.time_of_day.includes('anytime')
    );
  }

  // Filter by location if specified
  if (location) {
    const locationLower = location.toLowerCase();
    candidates = candidates.filter(e => 
      !e.neighborhood || 
      e.neighborhood.toLowerCase().includes(locationLower) ||
      e.area?.toLowerCase().includes(locationLower)
    );
  }

  // Calculate relevance for each candidate
  const results: VoiceSearchResult[] = candidates.map(entry => {
    const { score, reasons } = calculateRelevanceScore(
      entry,
      queryText,
      queryLower,
      time_of_day,
      location
    );

    return {
      entry,
      relevance_score: score,
      match_reason: reasons
    };
  });

  // Filter out very low relevance scores (below 10)
  const filteredResults = results.filter(r => r.relevance_score >= 10);

  // Sort by relevance score (descending)
  filteredResults.sort((a, b) => {
    if (b.relevance_score !== a.relevance_score) {
      return b.relevance_score - a.relevance_score;
    }
    // Tie-breaker: higher priority score
    return b.entry.priority_score - a.entry.priority_score;
  });

  // Return top N results
  return filteredResults.slice(0, limit);
}

/**
 * Get current time of day based on local time
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 2) return 'late_night';
  return 'night'; // 2am - 5am
}

/**
 * Search with automatic time-of-day detection
 */
export function searchVoiceQueryAuto(
  pack: OfflineFirstTravelPack,
  query: Omit<VoiceSearchQuery, 'time_of_day'> & { auto_time?: boolean }
): VoiceSearchResult[] {
  const timeOfDay = query.auto_time ? getCurrentTimeOfDay() : undefined;
  return searchVoiceQuery(pack, { ...query, time_of_day: timeOfDay });
}

/**
 * Get entries by urgency level (for emergency situations)
 */
export function getEntriesByUrgency(
  pack: OfflineFirstTravelPack,
  urgency: UrgencyLevel,
  limit?: number
): OfflineFirstPackEntry[] {
  const entries = pack.entries
    .filter(e => e.urgency === urgency)
    .sort((a, b) => b.priority_score - a.priority_score);
  
  return limit ? entries.slice(0, limit) : entries;
}

/**
 * Get entries by time of day
 */
export function getEntriesByTimeOfDay(
  pack: OfflineFirstTravelPack,
  timeOfDay: TimeOfDay,
  limit?: number
): OfflineFirstPackEntry[] {
  const entries = pack.entries
    .filter(e => e.time_of_day.includes(timeOfDay) || e.time_of_day.includes('anytime'))
    .sort((a, b) => b.priority_score - a.priority_score);
  
  return limit ? entries.slice(0, limit) : entries;
}
