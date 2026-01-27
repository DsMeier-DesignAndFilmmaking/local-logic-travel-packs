/**
 * Offline Situational Search
 *
 * Matches human/voice language → situations (headlines, microSituations), not just keywords.
 *
 * ---
 * MATCHING ORDER (evaluated together; scoring reflects priority)
 * ---
 * 1. Situational phrase: query concepts overlap headline/title concepts → +50
 * 2. Headline / microSituation title: exact token, phrase-in-order, or fuzzy token match
 * 3. Action / whatToDoInstead: exact or fuzzy
 * 4. searchableText: fallback substring
 *
 * ---
 * SCORING RULES
 * ---
 * - Situational overlap (query-concept ∩ item-concept): +50 once per item
 * - Phrase in order (headline or title): +40
 * - Exact token in headline: +35
 * - Exact token in microSituation title: +30
 * - Fuzzy token matches in headline+title: +8 per matching query token, cap ~+24
 * - Exact token in an action: +20 per matching action (we collect matchedActions)
 * - Exact token in whatToDoInstead: +18
 * - Fuzzy in action/advice: +4 per matching token, cap ~+12
 * - searchableText contains full query: +5
 * - Per additional matching query token (beyond first): +5, cap +15
 * Cap total at 100.
 *
 * ---
 * FALLBACK (no strong match)
 * ---
 * When best score < STRONG_MATCH_THRESHOLD (25) or 0 results:
 * Return 2–3 high-value microSituations: broadly useful (food, transport, safety, things to do),
 * not time-sensitive. matchType='fallback', relevanceScore=0, matchedActions=[].
 */

import type { MicroSituation, TravelPack } from '@/types/travel';
import { buildOfflineSearchIndex } from './offlineSearchIndex';
import type { OfflineSearchIndexItem } from './offlineSearchIndex';
import type { SituationConcept } from './situationalPhrases';
import {
  getQueryConcepts,
  getItemConcepts,
  hasSituationalOverlap,
} from './situationalPhrases';
import {
  toWords,
  fuzzyTokenMatch,
  countTokenMatches,
  containsSubstring,
  phraseContainsInOrder,
  anyTokenMatches,
} from './fuzzyMatch';

/** Minimum score to count as a strong match. Below this → fallback. */
export const STRONG_MATCH_THRESHOLD = 25;

export type MatchType =
  | 'situational'
  | 'headline_title'
  | 'action_advice'
  | 'keyword'
  | 'fallback';

/**
 * One microSituation match. Returned in place of raw action snippets.
 */
export interface MicroSituationMatch {
  cardHeadline: string;
  microSituation: MicroSituation;
  matchedActions: string[];
  city: string;
  relevanceScore: number;
  matchType: MatchType;
}

type Tier1Pack = { city: string; country?: string; tier1: TravelPack['tiers']['tier1'] };

// --- Broad usefulness and time-sensitive (for fallback) -----------------------------------------

const BROAD_TERMS = [
  'food', 'eat', 'restaurant', 'lost', 'direction', 'safe', 'thing', 'do', 'activity',
  'time', 'rest', 'toilet', 'pharmacy', 'metro', 'bus', 'taxi', 'coffee', 'park', 'museum',
  'local', 'area', 'quick', 'transport', 'emergency', 'free', 'nearby', 'meal', 'around',
  'getting', 'walk', 'nearest', 'public', 'bite', 'supermarket', 'café', 'cafe',
];

const TIME_SENSITIVE = [
  'late night', 'midnight', '2am', '1am', 'early morning', '5am', '6am', '7am',
  'after 10', 'after hours', 'after 1am', 'until 1', '5:30am', '1:15am', '12:30am',
];

function scoreFallbackCandidates(
  headline: string,
  microTitle: string,
  actions: string[],
  whatToDoInstead: string | undefined
): number {
  const text = `${headline} ${microTitle} ${actions.join(' ')} ${whatToDoInstead || ''}`.toLowerCase();
  let s = 0;
  for (const t of BROAD_TERMS) {
    if (text.includes(t)) {
      s += 2;
      break;
    }
  }
  for (const t of TIME_SENSITIVE) {
    if (text.includes(t)) {
      s -= 2;
      break;
    }
  }
  if (actions.length > 0) s += 1;
  return s;
}

/**
 * Fallback: 2–3 high-value microSituations when no strong match.
 */
function getFallbackMicroSituations(
  pack: Tier1Pack,
  limit: number = 3
): MicroSituationMatch[] {
  const out: { m: MicroSituationMatch; score: number }[] = [];
  const city = pack.city;

  for (const card of pack.tier1?.cards ?? []) {
    for (const micro of card.microSituations ?? []) {
      const score = scoreFallbackCandidates(
        card.headline,
        micro.title,
        micro.actions,
        micro.whatToDoInstead
      );
      out.push({
        m: {
          cardHeadline: card.headline,
          microSituation: { title: micro.title, actions: micro.actions, whatToDoInstead: micro.whatToDoInstead },
          matchedActions: [],
          city,
          relevanceScore: 0,
          matchType: 'fallback',
        },
        score,
      });
    }
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit).map((x) => x.m);
}

// --- Core search ---------------------------------------------------------------------------------

function scoreItem(
  item: OfflineSearchIndexItem,
  queryTokens: string[],
  queryLower: string,
  queryConcepts: Set<SituationConcept>
): { score: number; matchedActions: string[]; matchType: MatchType } {
  const matchedActions: string[] = [];
  let score = 0;
  let matchType: MatchType = 'keyword';

  const headline = item.headline;
  const title = item.microSituationTitle;
  const headlineTitle = `${headline} ${title}`.toLowerCase();
  const itemConcepts = getItemConcepts(headline, title);

  if (queryTokens.length === 0) {
    return { score: 0, matchedActions, matchType: 'keyword' };
  }

  // 1) Situational overlap
  if (hasSituationalOverlap(queryConcepts, itemConcepts)) {
    score += 50;
    matchType = 'situational';
  }

  // 2) Headline / title
  if (phraseContainsInOrder(headlineTitle, queryTokens)) {
    score += 40;
    if (matchType === 'keyword') matchType = 'headline_title';
  }
  const headWords = toWords(headline);
  const titleWords = toWords(title);
  for (const t of queryTokens) {
    if (headWords.some((w) => fuzzyTokenMatch(t, w)) || containsSubstring(headline, t)) {
      score += 35;
      if (matchType === 'keyword') matchType = 'headline_title';
      break;
    }
  }
  for (const t of queryTokens) {
    if (titleWords.some((w) => fuzzyTokenMatch(t, w)) || containsSubstring(title, t)) {
      score += 30;
      if (matchType === 'keyword') matchType = 'headline_title';
      break;
    }
  }
  const fuzzyHeadTitle = Math.min(24, countTokenMatches(queryTokens, headlineTitle) * 8);
  score += fuzzyHeadTitle;

  // 3) Action / whatToDoInstead
  for (const a of item.actions) {
    const aLower = a.toLowerCase();
    if (queryTokens.some((t) => containsSubstring(aLower, t) || toWords(a).some((w) => fuzzyTokenMatch(t, w)))) {
      score += 20;
      matchedActions.push(a);
      if (matchType === 'keyword') matchType = 'action_advice';
    }
  }
  if (item.whatToDoInstead) {
    const w = item.whatToDoInstead.toLowerCase();
    if (queryTokens.some((t) => containsSubstring(w, t)) || anyTokenMatches(queryTokens, item.whatToDoInstead)) {
      score += 18;
      if (matchType === 'keyword') matchType = 'action_advice';
    }
    score += Math.min(12, countTokenMatches(queryTokens, item.whatToDoInstead) * 4);
  }

  // 4) searchableText fallback
  if (containsSubstring(item.searchableText, queryLower)) {
    score += 5;
  }

  // Extra: multiple query tokens matching
  const nMatch = queryTokens.filter(
    (t) =>
      containsSubstring(headlineTitle, t) ||
      item.actions.some((a) => containsSubstring(a.toLowerCase(), t)) ||
      (item.whatToDoInstead && containsSubstring(item.whatToDoInstead.toLowerCase(), t))
  ).length;
  score += Math.min(15, Math.max(0, nMatch - 1) * 5);

  score = Math.min(100, score);
  return { score, matchedActions, matchType };
}

/**
 * Run situational search over a pack. Returns microSituations, not raw actions.
 *
 * - Uses the derived search index.
 * - Applies lightweight fuzzy + situational phrase scoring.
 * - If no strong match (best < STRONG_MATCH_THRESHOLD), returns fallback microSituations.
 */
export function searchSituational(
  pack: Tier1Pack,
  query: string
): MicroSituationMatch[] {
  const cleaned = query.trim().toLowerCase();
  const queryTokens = toWords(cleaned).filter((w) => w.length > 1);
  const queryConcepts = getQueryConcepts(queryTokens);

  const fake: TravelPack = {
    city: pack.city,
    country: pack.country || '',
    tiers: { tier1: pack.tier1 },
  };
  const index = buildOfflineSearchIndex(fake);

  const byKey = new Map<string, { score: number; matchedActions: string[]; matchType: MatchType; item: OfflineSearchIndexItem }>();
  for (const item of index) {
    const key = `${item.headline}\0${item.microSituationTitle}`;
    const { score, matchedActions, matchType } = scoreItem(item, queryTokens, cleaned, queryConcepts);
    const cur = byKey.get(key);
    if (!cur || score > cur.score) {
      byKey.set(key, { score, matchedActions, matchType, item });
    } else if (score === cur.score && matchedActions.length > cur.matchedActions.length) {
      byKey.set(key, { ...cur, matchedActions });
    }
  }

  const list: MicroSituationMatch[] = [];
  for (const { score, matchedActions, matchType, item } of byKey.values()) {
    if (score <= 0) continue;
    list.push({
      cardHeadline: item.headline,
      microSituation: {
        title: item.microSituationTitle,
        actions: item.actions,
        whatToDoInstead: item.whatToDoInstead,
      },
      matchedActions,
      city: pack.city,
      relevanceScore: score,
      matchType,
    });
  }

  list.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const best = list[0]?.relevanceScore ?? 0;
  if (list.length === 0 || best < STRONG_MATCH_THRESHOLD) {
    return getFallbackMicroSituations(pack, 3);
  }

  return list;
}
