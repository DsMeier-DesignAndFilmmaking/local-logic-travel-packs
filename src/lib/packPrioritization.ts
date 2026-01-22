/**
 * Internal Travel Pack Prioritization System
 * 
 * This structure avoids UX bloat by keeping prioritization logic internal.
 * The UI remains simple while we can intelligently surface the highest-value
 * content based on universal travel pain points.
 * 
 * Future AI personalization can adjust priorityScore dynamically without
 * changing UI components. Premium features can add city-specific context
 * or personalized recommendations using the same data model.
 */

import { OfflineTravelPack } from '@/types';

/**
 * Global travel pain-point categories
 * These represent universal traveler frustrations, not activity types.
 * This categorization enables future AI to understand what problems
 * we're solving, not just what activities we're recommending.
 */
export enum PainPointCategory {
  ARRIVAL_CONFUSION = 'arrival_confusion',
  TOURIST_TRAPS = 'tourist_traps',
  DECISION_FATIGUE = 'decision_fatigue',
  SAFETY_GAPS = 'safety_gaps',
  TIME_WASTE = 'time_waste',
  CULTURAL_MISSTEPS = 'cultural_missteps',
  OFFLINE_PREPARATION = 'offline_preparation',
}

/**
 * Internal Travel Pack Item Model
 * 
 * Each item solves a specific travel pain point with:
 * - priorityScore: Higher = more urgent/valuable to solve (0-100)
 * - category: Which universal pain point this addresses
 * - reason: Why this matters globally (for AI understanding)
 * - cityContext: How it adapts to specific cities (enables future personalization)
 * 
 * This structure separates "what problem" from "what city", enabling:
 * 1. AI to learn which pain points matter most
 * 2. Premium features to add city-specific depth
 * 3. Personalization without UI complexity
 */
export interface TravelPackItem {
  id: string;
  title: string;
  category: PainPointCategory;
  priorityScore: number; // 0-100, higher = more urgent
  reason: string; // Why this matters to travelers globally
  cityContext: string; // How it adapts to the entered city
  content: string; // The actual tip/advice content
}

/**
 * Prioritization function
 * 
 * TODO: AI Integration - Dynamic Priority Score Adjustment
 * 
 * What AI will do:
 * - Adjust priorityScore values based on context (time of day, season, user behavior)
 * - Recalculate scores for AI-generated items before sorting
 * - Learn from user interactions to improve prioritization over time
 * 
 * Why it belongs here:
 * - This function is called after AI generates TravelPackItem[] array
 * - AI may generate items with base priorityScore, then adjust based on context
 * - Sorting happens here before transformation to UI format
 * 
 * Inputs needed (future enhancement):
 * - items: TravelPackItem[] - From AI generation
 * - context?: {
 *     timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
 *     season?: 'spring' | 'summer' | 'fall' | 'winter'
 *     userHistory?: string[] - Previously viewed/downloaded packs
 *   }
 * 
 * AI processing (future):
 * - AI can boost priorityScore for items relevant to current time/season
 * - Example: "Metro hours" gets higher score in evening, "Offline tips" in winter
 * - Can personalize based on user's travel history/preferences
 * 
 * Sorts items by priorityScore (highest first) to ensure the most
 * valuable pain-relief content surfaces first. This happens internally
 * - the UI doesn't need to know about scores or categories.
 * 
 * Future enhancements:
 * - AI can adjust scores based on user behavior
 * - Premium can boost city-specific items
 * - Personalization can reorder without UI changes
 */
export function prioritizePackItems(items: TravelPackItem[]): TravelPackItem[] {
  // TODO: Before sorting, allow AI to adjust priorityScore based on context
  // Example: items.forEach(item => { item.priorityScore = aiAdjustScore(item, context); });
  
  return [...items].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Transform prioritized items back to UI format
 * 
 * This function converts our internal pain-point-driven structure
 * back to the existing OfflineTravelPack format that the UI expects.
 * The UI never sees priorityScore, category, or reason - it just
 * gets better-organized, higher-value content.
 * 
 * This separation means:
 * - UI stays simple (no filters, toggles, or complexity)
 * - We can change prioritization logic without touching components
 * - Future AI/premium features can modify items before transformation
 */
export function transformToUIPack(
  city: string,
  version: string,
  lastUpdated: string,
  context: string,
  prioritizedItems: TravelPackItem[]
): OfflineTravelPack {
  // Group items by their display category (mapping from pain points to UI sections)
  const mustKnowFirst: string[] = [];
  const neighborhoods: Array<{ name: string; whyItMatters: string; bestFor: string }> = [];
  const eatLikeALocal: string[] = [];
  const avoidTheseMistakes: string[] = [];
  const offlineTips: string[] = [];

  prioritizedItems.forEach((item) => {
    // Map pain-point categories to UI sections
    // This mapping can evolve without changing UI components
    switch (item.category) {
      case PainPointCategory.ARRIVAL_CONFUSION:
      case PainPointCategory.SAFETY_GAPS:
      case PainPointCategory.CULTURAL_MISSTEPS:
        mustKnowFirst.push(item.content);
        break;
      case PainPointCategory.TOURIST_TRAPS:
        // Neighborhoods are handled separately as they're structured data
        if (item.id.startsWith('neighborhood-')) {
          // Parse neighborhood data from cityContext (format: "whyItMatters|bestFor")
          const parts = item.cityContext.split('|');
          if (parts.length >= 2) {
            neighborhoods.push({
              name: item.title,
              whyItMatters: parts[0].trim(),
              bestFor: parts[1].trim(),
            });
          }
        } else if (item.content) {
          // Only add to avoidTheseMistakes if there's actual content
          avoidTheseMistakes.push(item.content);
        }
        break;
      case PainPointCategory.DECISION_FATIGUE:
      case PainPointCategory.TIME_WASTE:
        eatLikeALocal.push(item.content);
        break;
      case PainPointCategory.OFFLINE_PREPARATION:
        offlineTips.push(item.content);
        break;
    }
  });

  return {
    city,
    version,
    lastUpdated,
    context,
    mustKnowFirst,
    neighborhoods,
    eatLikeALocal,
    avoidTheseMistakes,
    offlineTips,
  };
}
