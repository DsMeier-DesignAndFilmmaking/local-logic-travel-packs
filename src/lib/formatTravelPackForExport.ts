/**
 * Format Travel Pack for Export
 * 
 * Pure function that converts TravelInsight[] to a normalized, text-first structure
 * optimized for PDF generation and offline export.
 * 
 * This formatter:
 * - Groups insights by category
 * - Provides text-first structure (no UI dependencies)
 * - Is independent of browser APIs
 * - Can be used in Node.js/server environments
 * 
 * Future: This structure can be directly consumed by PDF generators,
 * markdown converters, or other export formats.
 */

import { TravelInsight } from './travelPackSchema';

export interface ExportTravelPack {
  city: string;
  sections: {
    category: string;
    items: {
      title: string;
      summary: string;
      reasoning?: string;
    }[];
  }[];
}

/**
 * Format TravelInsight[] to normalized export structure
 * 
 * Groups insights by category and creates a text-first structure
 * suitable for PDF generation, markdown export, or other formats.
 * 
 * @param insights - Array of TravelInsight objects
 * @returns Normalized export structure grouped by category
 */
export function formatTravelPackForExport(
  insights: TravelInsight[]
): ExportTravelPack {
  if (insights.length === 0) {
    return {
      city: '',
      sections: [],
    };
  }

  // Get city from first insight (all insights should have same city)
  const city = insights[0].city;

  // Group insights by category
  const categoryMap = new Map<string, TravelInsight[]>();

  insights.forEach((insight) => {
    const category = insight.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(insight);
  });

  // Convert map to sections array
  const sections = Array.from(categoryMap.entries()).map(([category, items]) => ({
    category,
    items: items.map((insight) => ({
      title: insight.title,
      summary: insight.summary,
      reasoning: insight.reasoning,
    })),
  }));

  // Sort sections by category name for consistent output
  sections.sort((a, b) => a.category.localeCompare(b.category));

  return {
    city,
    sections,
  };
}
