/**
 * Canonical Travel Pack Schema
 * 
 * Defines the 3-tier structure for travel insights:
 * - Tier 1: Universal advice (applies to any city)
 * - Tier 2: City-specific strategy (Paris-specific, London-specific, etc.)
 * - Tier 3: Conditional/contextual insights (time-based, season-based, etc.)
 * 
 * This schema enables monetization by tier without UI changes.
 * All tiers exist in data; UI simply renders all items.
 */

export type TravelTier = 1 | 2 | 3;

export type TravelInsightCategory =
  | "arrival"
  | "movement"
  | "food"
  | "neighborhoods"
  | "timing"
  | "social"
  | "mistakes";

export type TravelInsight = {
  id: string;
  city: string;
  title: string;
  summary: string;

  category: TravelInsightCategory;
  tier: TravelTier;
  priorityScore: number; // 1–100
  confidenceImpact: "low" | "medium" | "high";

  reasoning?: string;
  contextTriggers?: string[];
};
