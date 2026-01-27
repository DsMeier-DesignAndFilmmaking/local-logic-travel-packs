/**
 * Format Travel Pack for Mission Export
 * * Converts the nested TravelPack (Tiers > Cards > Situations) into a 
 * flat, text-heavy structure optimized for PDF, Markdown, or Print.
 */

import { TravelPack, ProblemCard, MicroSituation } from '@/types/travel';

export interface ExportSection {
  heading: string;    // e.g., "ARRIVAL PROTOCOL"
  subheading: string; // e.g., "Exiting Airport"
  protocol: string[]; // e.g., ["Follow green signs", "Ignore fixers"]
}

export interface ExportMissionBrief {
  city: string;
  country: string;
  generatedAt: string;
  intel: ExportSection[];
}

/**
 * Transforms a Tiered TravelPack into a flat Mission Briefing.
 */
export function formatTravelPackForExport(pack: TravelPack): ExportMissionBrief {
  const intel: ExportSection[] = [];

  // 1. Process Tier 1 (Tactical Essentials)
  if (pack.tiers?.tier1?.cards) {
    pack.tiers.tier1.cards.forEach((card: ProblemCard) => {
      card.microSituations.forEach((ms: MicroSituation) => {
        intel.push({
          heading: card.headline.toUpperCase(),
          subheading: ms.title,
          protocol: ms.actions
        });
      });
    });
  }

  // 2. Process Tier 2 (Strategic/Logistical) if exists
  if (pack.tiers?.tier2?.cards) {
    pack.tiers.tier2.cards.forEach((card: ProblemCard) => {
      card.microSituations.forEach((ms: MicroSituation) => {
        intel.push({
          heading: `LOGISTICS: ${card.headline.toUpperCase()}`,
          subheading: ms.title,
          protocol: ms.actions
        });
      });
    });
  }

  return {
    city: pack.city,
    country: pack.country,
    generatedAt: pack.downloadedAt || new Date().toISOString(),
    intel: intel
  };
}