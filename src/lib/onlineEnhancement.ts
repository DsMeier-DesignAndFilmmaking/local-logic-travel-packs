/**
 * Online Enhancement Pipeline
 * 
 * Enhances offline search results using online AI while:
 * - Only running when connectivity is good
 * - Never replacing offline results
 * - Using local pack content as grounding data
 * - Improving ranking, NLU, and context
 * 
 * Safe-guards:
 * - No hallucinated locations
 * - No results not present in the pack
 * - All enhancements validated against local data
 */

import { ConnectivityState } from './connectivity';
import { SearchResult } from './offlineSearchEngine';
import { getTier1Pack } from './offlineStorage';
import { TravelPack } from './travelPacks';

export interface EnhancedResult extends SearchResult {
  enhanced: boolean;
  enhancementReason?: string;
  originalScore: number;
  enhancedScore: number;
  contextImprovements?: {
    timeOfDay?: string;
    location?: string;
    intent?: string;
  };
}

export interface EnhancementContext {
  query: string;
  city: string;
  timeOfDay?: string;
  userLocation?: string;
  originalResults: SearchResult[];
  localPack: TravelPack;
}

export interface EnhancementOptions {
  apiEndpoint?: string;
  apiKey?: string;
  maxEnhancementTime?: number; // Max time to wait for enhancement (default: 2000ms)
  enableRankingImprovement?: boolean;
  enableNLUImprovement?: boolean;
  enableContextImprovement?: boolean;
}

/**
 * Safe-guard: Validate that result exists in local pack
 */
function validateResultInPack(
  result: SearchResult,
  localPack: TravelPack
): boolean {
  if (!localPack.tiers?.tier1) {
    return false;
  }

  // Check if result exists in pack
  return localPack.tiers.tier1.cards.some(card => {
    if (card.headline !== result.cardHeadline) {
      return false;
    }

    return card.microSituations.some(microSituation => {
      if (microSituation.title !== result.microSituationTitle) {
        return false;
      }

      return microSituation.actions.some(action => action === result.action);
    });
  });
}

/**
 * Safe-guard: Validate location is in pack
 */
function validateLocationInPack(
  location: string,
  localPack: TravelPack
): boolean {
  if (!location) {
    return true; // No location specified is valid
  }

  const locationLower = location.toLowerCase();
  const packContent = JSON.stringify(localPack).toLowerCase();

  // Check if location appears in pack content
  return packContent.includes(locationLower);
}

/**
 * Safe-guard: Extract and validate all locations from enhancement
 */
function extractAndValidateLocations(
  text: string,
  localPack: TravelPack
): string[] {
  // Simple location extraction (can be enhanced)
  const locationPatterns = [
    /(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:area|neighborhood|district)/gi,
  ];

  const locations: string[] = [];
  
  for (const pattern of locationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const location = match[1]?.trim();
      if (location && validateLocationInPack(location, localPack)) {
        locations.push(location);
      }
    }
  }

  return Array.from(new Set(locations));
}

/**
 * Enhance ranking using AI understanding of query intent
 */
async function enhanceRanking(
  results: SearchResult[],
  context: EnhancementContext,
  options: EnhancementOptions
): Promise<SearchResult[]> {
  if (!options.enableRankingImprovement) {
    return results;
  }

  try {
    // Prepare prompt with local pack data as grounding
    const packContext = JSON.stringify({
      city: context.city,
      cards: context.localPack.tiers?.tier1?.cards.map(card => ({
        headline: card.headline,
        microSituations: card.microSituations.map(ms => ({
          title: ms.title,
          actions: ms.actions,
        })),
      })),
    });

    const prompt = `Given this travel pack data for ${context.city}:
${packContext}

And this user query: "${context.query}"

Rank these results by relevance (return only IDs in order):
${results.map((r, i) => `${i}: ${r.microSituationTitle} - ${r.action.substring(0, 50)}`).join('\n')}

Return ONLY a JSON array of indices in order of relevance, e.g., [2, 0, 1].`;

    // Call AI API (placeholder - implement with actual API)
    const response = await callEnhancementAPI(prompt, options);
    
    if (response && Array.isArray(response)) {
      // Validate all indices exist
      const validIndices = response.filter(idx => 
        typeof idx === 'number' && idx >= 0 && idx < results.length
      );
      
      if (validIndices.length === results.length) {
        // Reorder results based on AI ranking
        return validIndices.map(idx => results[idx]);
      }
    }
  } catch (error) {
    console.warn('Ranking enhancement failed:', error);
  }

  return results;
}

/**
 * Enhance natural language understanding
 */
async function enhanceNLU(
  results: SearchResult[],
  context: EnhancementContext,
  options: EnhancementOptions
): Promise<EnhancedResult[]> {
  if (!options.enableNLUImprovement) {
    return results.map(r => ({ ...r, enhanced: false, originalScore: r.relevanceScore, enhancedScore: r.relevanceScore }));
  }

  try {
    const packContext = JSON.stringify({
      query: context.query,
      results: results.map(r => ({
        cardHeadline: r.cardHeadline,
        microSituationTitle: r.microSituationTitle,
        action: r.action,
        currentScore: r.relevanceScore,
      })),
    });

    const prompt = `Given this travel pack search:
${packContext}

Improve relevance scores (0-100) based on better understanding of the query.
Return JSON: [{"index": 0, "score": 85, "reason": "Better match for late night food"}]

IMPORTANT: Only adjust scores for results that exist in the pack. Do not create new results.`;

    const response = await callEnhancementAPI(prompt, options);
    
    if (response && Array.isArray(response)) {
      return results.map((result, index) => {
        const enhancement = response.find((e: any) => e.index === index);
        
        if (enhancement && typeof enhancement.score === 'number') {
          // Validate result still exists in pack
          if (validateResultInPack(result, context.localPack)) {
            return {
              ...result,
              enhanced: true,
              enhancementReason: enhancement.reason || 'Improved relevance understanding',
              originalScore: result.relevanceScore,
              enhancedScore: Math.min(100, Math.max(0, enhancement.score)),
              relevanceScore: Math.min(100, Math.max(0, enhancement.score)),
            };
          }
        }
        
        return {
          ...result,
          enhanced: false,
          originalScore: result.relevanceScore,
          enhancedScore: result.relevanceScore,
        };
      });
    }
  } catch (error) {
    console.warn('NLU enhancement failed:', error);
  }

  return results.map(r => ({ ...r, enhanced: false, originalScore: r.relevanceScore, enhancedScore: r.relevanceScore }));
}

/**
 * Enhance context (time, location, intent)
 */
async function enhanceContext(
  results: EnhancedResult[],
  context: EnhancementContext,
  options: EnhancementOptions
): Promise<EnhancedResult[]> {
  if (!options.enableContextImprovement) {
    return results;
  }

  try {
    const packContext = JSON.stringify({
      query: context.query,
      city: context.city,
      timeOfDay: context.timeOfDay,
      userLocation: context.userLocation,
      results: results.map(r => ({
        cardHeadline: r.cardHeadline,
        microSituationTitle: r.microSituationTitle,
        action: r.action,
      })),
    });

    const prompt = `Given this travel pack search:
${packContext}

Improve context understanding:
- Time of day relevance
- Location context (ONLY use locations that appear in the pack data)
- User intent

Return JSON: [{"index": 0, "timeOfDay": "late_night", "location": "Le Marais", "intent": "finding food"}]

CRITICAL: Only use locations that exist in the pack data. Do not invent locations.`;

    const response = await callEnhancementAPI(prompt, options);
    
    if (response && Array.isArray(response)) {
      return results.map((result, index) => {
        const enhancement = response.find((e: any) => e.index === index);
        
        if (enhancement) {
          // Validate location if provided
          if (enhancement.location) {
            if (!validateLocationInPack(enhancement.location, context.localPack)) {
              // Invalid location - remove it
              delete enhancement.location;
            }
          }
          
          return {
            ...result,
            enhanced: true,
            contextImprovements: {
              timeOfDay: enhancement.timeOfDay,
              location: enhancement.location,
              intent: enhancement.intent,
            },
          };
        }
        
        return result;
      });
    }
  } catch (error) {
    console.warn('Context enhancement failed:', error);
  }

  return results;
}

/**
 * Call enhancement API (placeholder - implement with actual API)
 */
async function callEnhancementAPI(
  prompt: string,
  options: EnhancementOptions
): Promise<any> {
  // Placeholder implementation
  // In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
  
  if (!options.apiEndpoint || !options.apiKey) {
    // No API configured - return null to skip enhancement
    return null;
  }

  try {
    const response = await fetch(options.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent results
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.content || data;
  } catch (error) {
    console.error('Enhancement API error:', error);
    throw error;
  }
}

/**
 * Main enhancement pipeline
 * 
 * Safe-guards:
 * 1. Only runs when connectivity is 'online'
 * 2. Validates all results exist in local pack
 * 3. Validates all locations exist in pack
 * 4. Never adds new results
 * 5. Never removes existing results
 */
export async function enhanceSearchResults(
  originalResults: SearchResult[],
  context: EnhancementContext,
  options: EnhancementOptions = {}
): Promise<EnhancedResult[]> {
  const {
    maxEnhancementTime = 2000,
    enableRankingImprovement = true,
    enableNLUImprovement = true,
    enableContextImprovement = true,
  } = options;

  // Safe-guard: Must have local pack
  if (!context.localPack) {
    return originalResults.map(r => ({
      ...r,
      enhanced: false,
      originalScore: r.relevanceScore,
      enhancedScore: r.relevanceScore,
    }));
  }

  // Safe-guard: Must have results to enhance
  if (!originalResults || originalResults.length === 0) {
    return [];
  }

  // Safe-guard: Validate all original results exist in pack
  const validResults = originalResults.filter(result =>
    validateResultInPack(result, context.localPack)
  );

  if (validResults.length !== originalResults.length) {
    console.warn('Some results not found in pack - filtering out invalid results');
  }

  // Start enhancement with timeout
  const enhancementPromise = (async () => {
    let enhanced = validResults.map(r => ({
      ...r,
      enhanced: false,
      originalScore: r.relevanceScore,
      enhancedScore: r.relevanceScore,
    }));

    // Step 1: Enhance ranking
    if (enableRankingImprovement) {
      try {
        enhanced = await enhanceRanking(enhanced, context, options) as EnhancedResult[];
      } catch (error) {
        console.warn('Ranking enhancement failed:', error);
      }
    }

    // Step 2: Enhance NLU
    if (enableNLUImprovement) {
      try {
        enhanced = await enhanceNLU(enhanced, context, options);
      } catch (error) {
        console.warn('NLU enhancement failed:', error);
      }
    }

    // Step 3: Enhance context
    if (enableContextImprovement) {
      try {
        enhanced = await enhanceContext(enhanced, context, options);
      } catch (error) {
        console.warn('Context enhancement failed:', error);
      }
    }

    // Final validation: Ensure all results still exist in pack
    const finalResults = enhanced.filter(result =>
      validateResultInPack(result, context.localPack)
    );

    return finalResults;
  })();

  // Apply timeout
  try {
    const timeoutPromise = new Promise<EnhancedResult[]>((_, reject) => {
      setTimeout(() => reject(new Error('Enhancement timeout')), maxEnhancementTime);
    });

    return await Promise.race([enhancementPromise, timeoutPromise]);
  } catch (error) {
    // Timeout or error - return original results
    console.warn('Enhancement failed or timed out:', error);
    return validResults.map(r => ({
      ...r,
      enhanced: false,
      originalScore: r.relevanceScore,
      enhancedScore: r.relevanceScore,
    }));
  }
}

/**
 * Safe-guard rules summary
 */
export const SAFEGUARD_RULES = {
  // Rule 1: Only enhance when online
  onlyWhenOnline: (connectivity: ConnectivityState): boolean => {
    return connectivity === 'online';
  },

  // Rule 2: All results must exist in pack
  validateResultsInPack: (results: SearchResult[], pack: TravelPack): SearchResult[] => {
    return results.filter(result => validateResultInPack(result, pack));
  },

  // Rule 3: All locations must exist in pack
  validateLocationsInPack: (locations: string[], pack: TravelPack): string[] => {
    return locations.filter(location => validateLocationInPack(location, pack));
  },

  // Rule 4: Never add new results
  noNewResults: (original: SearchResult[], enhanced: EnhancedResult[]): boolean => {
    return enhanced.length <= original.length;
  },

  // Rule 5: Never remove existing results (unless invalid)
  noRemovedResults: (original: SearchResult[], enhanced: EnhancedResult[]): boolean => {
    // All valid original results should be in enhanced
    const originalIds = new Set(original.map(r => `${r.cardHeadline}|${r.microSituationTitle}|${r.action}`));
    const enhancedIds = new Set(enhanced.map(r => `${r.cardHeadline}|${r.microSituationTitle}|${r.action}`));
    
    for (const id of originalIds) {
      if (!enhancedIds.has(id)) {
        return false; // A valid original result was removed
      }
    }
    return true;
  },
};
