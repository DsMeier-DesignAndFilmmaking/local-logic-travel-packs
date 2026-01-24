/**
 * Voice Match Flow
 *
 * Offline only. Voice → text first; no cloud NLP.
 * Matching order: 1) Card headlines → 2) MicroSituation titles → 3) Action keywords
 * → 4) Tier-level fallback.
 *
 * See VOICE_MATCH_FLOW.md for the flow and example mappings.
 */

import type { TravelPack } from './travelPacks';
import { extractQueryTokens } from './transcriptNormalizer';
import { getQueryConcepts } from './situationalPhrases';
import type { SituationConcept } from './situationalPhrases';
import { toWords, containsSubstring, anyTokenMatches } from './fuzzyMatch';

type Tier1 = { city: string; country?: string; tier1: TravelPack['tiers']['tier1'] };

/** One microSituation match from the voice flow. */
export interface VoiceMatchResult {
  cardHeadline: string;
  microSituation: { title: string; actions: string[]; whatToDoInstead?: string };
  matchedActions: string[];
  city: string;
  matchLevel: 'headline' | 'headline_title' | 'action' | 'tier_fallback';
}

/** Tier-level fallback when 1–3 yield nothing. */
export interface TierFallbackResult {
  type: 'tier_fallback';
  tierTitle: string;
  suggestions: VoiceMatchResult[];
}

export type VoiceMatchOutput = VoiceMatchResult[] | TierFallbackResult;

// --- Step 1: tokens/concepts → headlines --------------------------------------

/** Headline (normalized, no emoji) → voice tokens that select it. */
const HEADLINE_KEYWORDS: Record<string, string[]> = {
  'i\'m lost / getting around': ['lost', 'direction', 'directions', 'find', 'around', 'getting', 'metro', 'bus', 'taxi', 'transport', 'transit', 'navigate', 'walk', 'where'],
  'i need food nearby': ['hungry', 'eat', 'eating', 'food', 'restaurant', 'meal', 'bite', 'lunch', 'dinner', 'breakfast', 'starving', 'cafe', 'café', 'coffee', 'drink', 'bakery', 'boulangerie', 'nearby'],
  'i have free time': ['free', 'time', 'activity', 'activities', 'bored', 'things', 'do', 'museum', 'park', 'hour', 'kill', 'what'],
  'something feels off': ['safe', 'safety', 'unsafe', 'scared', 'wrong', 'scam', 'suspicious', 'pickpocket', 'stolen', 'feel', 'off', 'uncomfortable', 'danger', 'weird', 'creepy', 'emergency'],
  'i don\'t know what to say': ['phrase', 'phrases', 'language', 'say', 'speak', 'order', 'english', 'translate', 'communicate'],
  'i\'m tired / overwhelmed': ['tired', 'overwhelm', 'overwhelmed', 'rest', 'break', 'quiet', 'calm', 'crowded', 'tourists', 'choices'],
  'surprise me': ['discover', 'spontaneous', 'surprise', 'local', 'hidden', 'random', 'explore', 'different'],
};

function normalizeHeadline(h: string): string {
  return h.replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
}

function headlineMatches(headline: string, tokens: string[], concepts: Set<SituationConcept>): boolean {
  const n = normalizeHeadline(headline);
  const keys = HEADLINE_KEYWORDS[n];
  if (keys) {
    for (const t of tokens) {
      if (keys.includes(t.toLowerCase())) return true;
    }
    for (const c of concepts) {
      if (keys.includes(c)) return true;
    }
  }
  // Fallback: token or concept in headline text
  const headlineWords = toWords(n);
  for (const t of tokens) {
    if (headlineWords.some((w) => w.includes(t) || t.includes(w))) return true;
  }
  return false;
}

// --- Step 2: tokens → microSituation title (within a card) ---------------------

/** (normalized headline) → (normalized micro title) → voice tokens. */
const MICRO_KEYWORDS: Record<string, Record<string, string[]>> = {
  'i need food nearby': {
    'quick bite': ['hungry', 'quick', 'snack', 'fast', 'bite', 'bakery', 'sandwich', 'croissant', 'cheap'],
    'sit-down meal': ['meal', 'lunch', 'dinner', 'restaurant', 'sit', 'table', 'formule', 'menu', 'tip', 'vegetarian', 'gluten'],
    'dietary restrictions': ['diet', 'vegetarian', 'vegan', 'gluten', 'allergy'],
  },
  'something feels off': {
    'safety concern': ['unsafe', 'safe', 'scared', 'danger', 'emergency', 'police', 'ambulance', 'embassy', 'avoid', 'instinct', 'uncomfortable'],
    'scam / suspicious': ['scam', 'suspicious', 'bracelet', 'petition', 'pickpocket', 'beggar', 'money', 'trick'],
    'lost item': ['wallet', 'passport', 'stolen', 'lost', 'lost found', 'report', 'cancel', 'card'],
  },
  'i\'m lost / getting around': {
    'i\'m lost': ['lost', 'find', 'landmark', 'map', 'where'],
    'public transport': ['metro', 'bus', 'ticket', 'navigo', 'validate', 'station'],
    'taxi / ride share': ['taxi', 'uber', 'bolt', 'ride', 'airport'],
  },
  'i\'m tired / overwhelmed': {
    'need rest': ['rest', 'tired', 'break', 'quiet', 'park', 'café', 'bench'],
    'too many tourists': ['crowded', 'tourists', 'quiet', 'local'],
    'overwhelmed by choices': ['choices', 'overwhelm', 'pick', 'recommend'],
  },
};

function microTitleMatches(
  normHeadline: string,
  microTitle: string,
  tokens: string[]
): boolean {
  const cardMap = MICRO_KEYWORDS[normHeadline];
  if (!cardMap) return false;
  const normMicro = microTitle.toLowerCase().trim();
  const kw = cardMap[normMicro];
  if (kw) {
    for (const t of tokens) {
      if (kw.includes(t.toLowerCase())) return true;
    }
  }
  return false;
}

// --- Step 3: action keywords ---------------------------------------------------

function matchingActions(tokens: string[], actions: string[], whatToDo?: string): string[] {
  const out: string[] = [];
  const texts = [...actions, ...(whatToDo ? [whatToDo] : [])];
  for (const a of actions) {
    const lower = a.toLowerCase();
    if (tokens.some((t) => containsSubstring(lower, t)) || anyTokenMatches(tokens, a)) {
      out.push(a);
    }
  }
  return out.length > 0 ? out : actions;
}

// --- Step 4: tier-level fallback -----------------------------------------------

const BROAD = ['food', 'eat', 'restaurant', 'lost', 'direction', 'safe', 'thing', 'do', 'activity', 'time', 'rest', 'toilet', 'pharmacy', 'metro', 'bus', 'taxi'];
const TIME_SENSITIVE = ['late night', 'midnight', '2am', '1am', 'early morning', '5am', '6am', '7am'];

function scoreForTierFallback(headline: string, microTitle: string, actions: string[], whatToDo?: string): number {
  const text = `${headline} ${microTitle} ${actions.join(' ')} ${whatToDo || ''}`.toLowerCase();
  let s = 0;
  for (const b of BROAD) {
    if (text.includes(b)) {
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

function getTierFallback(tier: NonNullable<TravelPack['tiers']['tier1']>, city: string, tierTitle: string): TierFallbackResult {
  const candidates: { headline: string; micro: { title: string; actions: string[]; whatToDoInstead?: string }; score: number }[] = [];
  for (const card of tier.cards ?? []) {
    for (const micro of card.microSituations ?? []) {
      const score = scoreForTierFallback(card.headline, micro.title, micro.actions, micro.whatToDoInstead);
      candidates.push({
        headline: card.headline,
        micro: { title: micro.title, actions: micro.actions, whatToDoInstead: micro.whatToDoInstead },
        score,
      });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, 3).map((c) => ({
    cardHeadline: c.headline,
    microSituation: c.micro,
    matchedActions: [] as string[],
    city,
    matchLevel: 'tier_fallback' as const,
  }));
  return { type: 'tier_fallback', tierTitle, suggestions: top };
}

// --- Main flow -----------------------------------------------------------------

/**
 * Match voice text to content: headlines → microSituation titles → action keywords
 * → tier-level fallback.  Returns MicroSituationMatch[] or TierFallbackResult.
 */
export function matchVoiceToContent(voiceText: string, pack: Tier1): VoiceMatchOutput {
  const tokens = extractQueryTokens(voiceText);
  const concepts = getQueryConcepts(tokens);

  const tier = pack.tier1;
  const city = pack.city;
  const tierTitle = tier?.title ?? 'Immediate Need';
  if (!tier?.cards?.length) {
    return { type: 'tier_fallback', tierTitle, suggestions: [] };
  }

  if (tokens.length === 0) {
    return getTierFallback(tier, city, tierTitle);
  }

  // Step 1: headlines
  const matchedCards = tier.cards.filter((c) => headlineMatches(c.headline, tokens, concepts));
  const scopeCards = matchedCards.length > 0 ? matchedCards : tier.cards;

  const results: VoiceMatchResult[] = [];

  for (const card of scopeCards) {
    const normHeadline = normalizeHeadline(card.headline);
    let matchedMicros = card.microSituations ?? [];

    // Step 2: microSituation titles (only if we have tokens)
    if (tokens.length > 0) {
      const byMicro = matchedMicros.filter((m) => microTitleMatches(normHeadline, m.title, tokens));
      if (byMicro.length > 0) matchedMicros = byMicro;
    }

    for (const micro of matchedMicros) {
      const ma = matchingActions(tokens, micro.actions, micro.whatToDoInstead);
      let level: VoiceMatchResult['matchLevel'] = 'headline';
      if (matchedMicros.length > 0 && microTitleMatches(normHeadline, micro.title, tokens)) level = 'headline_title';
      if (ma.length > 0 && ma.length < (micro.actions?.length ?? 0)) level = 'action';
      else if (ma.length > 0) level = 'action';

      results.push({
        cardHeadline: card.headline,
        microSituation: { title: micro.title, actions: micro.actions, whatToDoInstead: micro.whatToDoInstead },
        matchedActions: ma.length > 0 ? ma : (micro.actions ?? []),
        city,
        matchLevel: level,
      });
    }
  }

  if (results.length > 0) {
    return results;
  }

  return getTierFallback(tier, city, tierTitle);
}
