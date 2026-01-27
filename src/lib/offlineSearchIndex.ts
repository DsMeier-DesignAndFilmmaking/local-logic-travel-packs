/**
 * Offline Search Index
 *
 * Derives a flattened search index from travel pack JSON.
 * NOT stored as source of truth — compute from pack when needed (e.g. at load or when building a cache).
 */

import type { TravelPack, TravelPackTier } from '@/types/travel';

/** Tier key in pack.tiers (tier1, tier2, tier3, tier4) */
export type TierKey = 'tier1' | 'tier2' | 'tier3' | 'tier4';

/**
 * One entry in the flattened offline search index.
 * One row per microSituation (not per action).
 */
export interface OfflineSearchIndexItem {
  /** Tier key, e.g. "tier1" */
  tier: TierKey;
  /** Card headline */
  headline: string;
  /** MicroSituation title */
  microSituationTitle: string;
  /** All actions for this microSituation */
  actions: string[];
  /** Advice when present */
  whatToDoInstead: string | undefined;
  /** Combined string for matching: tier title + headline + microSituation title + actions + whatToDoInstead */
  searchableText: string;
}

/**
 * Flattened index: array of OfflineSearchIndexItem.
 * Order: by tier (tier1, tier2, …), then by card order, then by microSituation order.
 */
export type OfflineSearchIndex = OfflineSearchIndexItem[];

const TIER_KEYS: TierKey[] = ['tier1', 'tier2', 'tier3', 'tier4'];

/**
 * Build searchableText from parts.
 * Normalized: joined with space, trimmed. No extra normalization (e.g. lowercasing) — do that at query time.
 */
function buildSearchableText(parts: (string | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derives a flattened offline search index from a travel pack.
 * Traverses tiers → cards → microSituations; one index item per microSituation.
 *
 * @param pack - Travel pack (from API, file, or localStorage)
 * @returns Flattened OfflineSearchIndex. Empty if pack has no tiers/cards/microSituations.
 */
export function buildOfflineSearchIndex(pack: TravelPack): OfflineSearchIndex {
  const index: OfflineSearchIndex = [];
  const tiers = pack.tiers;

  if (!tiers) return index;

  for (const tierKey of TIER_KEYS) {
    const tier: TravelPackTier | undefined = tiers[tierKey];
    if (!tier?.cards?.length) continue;

    const tierTitle = tier.title ?? '';

    for (const card of tier.cards) {
      const headline = card.headline ?? '';
      if (!card.microSituations?.length) continue;

      for (const micro of card.microSituations) {
        const microTitle = micro.title ?? '';
        const actions = Array.isArray(micro.actions) ? micro.actions : [];
        const whatToDoInstead = micro.whatToDoInstead;

        const searchableText = buildSearchableText([
          tierTitle,
          headline,
          microTitle,
          ...actions,
          whatToDoInstead,
        ]);

        index.push({
          tier: tierKey,
          headline,
          microSituationTitle: microTitle,
          actions: [...actions],
          whatToDoInstead,
          searchableText,
        });
      }
    }
  }

  return index;
}
