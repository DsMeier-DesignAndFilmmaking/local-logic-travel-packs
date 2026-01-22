/**
 * Deterministic sorting utility for Travel Insights
 * 
 * Sorts insights by priorityScore (highest first) to ensure
 * the most valuable content surfaces first.
 * 
 * This is a pure function - deterministic and side-effect free.
 */

import { TravelInsight } from './travelPackSchema';

export function sortTravelInsights(insights: TravelInsight[]): TravelInsight[] {
  return [...insights].sort((a, b) => b.priorityScore - a.priorityScore);
}
