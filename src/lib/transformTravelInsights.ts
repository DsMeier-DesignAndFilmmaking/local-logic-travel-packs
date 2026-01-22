/**
 * Transform Travel Insights to UI Format
 * 
 * Converts TravelInsight[] (3-tier schema) to OfflineTravelPack format
 * that the UI expects. This transformation happens internally - the UI
 * never sees tiers, categories, or priority scores.
 */

import { TravelInsight } from './travelPackSchema';
import { OfflineTravelPack } from '@/types';

/**
 * Transform prioritized insights back to UI format
 * 
 * Maps TravelInsight categories to UI sections:
 * - arrival, social, mistakes → mustKnowFirst
 * - neighborhoods → neighborhoods (structured)
 * - food → eatLikeALocal
 * - timing, movement → various sections based on content
 * 
 * All tiers are included - no filtering happens here.
 * Future monetization can filter by tier before transformation.
 */
export function transformInsightsToUIPack(
  city: string,
  version: string,
  lastUpdated: string,
  context: string,
  insights: TravelInsight[]
): OfflineTravelPack {
  const mustKnowFirst: string[] = [];
  const neighborhoods: Array<{ name: string; whyItMatters: string; bestFor: string }> = [];
  const eatLikeALocal: string[] = [];
  const avoidTheseMistakes: string[] = [];
  const offlineTips: string[] = [];

  insights.forEach((insight) => {
    // Map categories to UI sections
    switch (insight.category) {
      case 'arrival':
      case 'social':
        mustKnowFirst.push(insight.summary);
        break;
      case 'neighborhoods':
        // Neighborhoods need special handling
        // Extract "bestFor" from reasoning (look for "Context:" prefix) or use contextTriggers
        let bestFor = insight.reasoning || '';
        if (bestFor.includes('Context:')) {
          bestFor = bestFor.split('Context:')[1].trim();
        } else if (insight.contextTriggers && insight.contextTriggers.length > 0) {
          // Use context triggers as bestFor if no context in reasoning
          bestFor = insight.contextTriggers.join(', ');
        }
        neighborhoods.push({
          name: insight.title,
          whyItMatters: insight.summary,
          bestFor: bestFor || insight.summary,
        });
        break;
      case 'food':
        eatLikeALocal.push(insight.summary);
        break;
      case 'mistakes':
        avoidTheseMistakes.push(insight.summary);
        break;
      case 'movement':
        // Movement insights go to mustKnowFirst or offlineTips based on content
        if (insight.summary.toLowerCase().includes('offline') || 
            insight.summary.toLowerCase().includes('screenshot') ||
            insight.summary.toLowerCase().includes('download')) {
          offlineTips.push(insight.summary);
        } else {
          mustKnowFirst.push(insight.summary);
        }
        break;
      case 'timing':
        // Timing insights can go to mustKnowFirst or avoidTheseMistakes
        if (insight.summary.toLowerCase().includes('don\'t') ||
            insight.summary.toLowerCase().includes('avoid')) {
          avoidTheseMistakes.push(insight.summary);
        } else {
          mustKnowFirst.push(insight.summary);
        }
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
