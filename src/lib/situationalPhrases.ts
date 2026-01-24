/**
 * Situational Phrases
 *
 * Maps human/voice language → situation concepts.
 * Used to prioritize emotional/situational matches over plain keyword matches.
 * Pack-agnostic: concepts align with typical card headlines (food, lost, safety, etc.).
 */

/** Concept keys used for situational overlap. */
export type SituationConcept =
  | 'food'
  | 'lost'
  | 'freetime'
  | 'safety'
  | 'tired'
  | 'language'
  | 'discover'
  | 'toilet'
  | 'pharmacy'
  | 'emergency'
  | 'cash';

/**
 * User/voice query terms → concept.
 * Typical ways people say things (e.g. "hungry", "I'm lost", "where to eat").
 */
export const QUERY_TERM_TO_CONCEPT: Record<string, SituationConcept> = {
  hungry: 'food',
  eat: 'food',
  eating: 'food',
  food: 'food',
  restaurant: 'food',
  meal: 'food',
  bite: 'food',
  lunch: 'food',
  dinner: 'food',
  breakfast: 'food',
  starving: 'food',
  cafe: 'food',
  café: 'food',
  coffee: 'food',
  drink: 'food',
  bakery: 'food',
  boulangerie: 'food',
  lost: 'lost',
  direction: 'lost',
  directions: 'lost',
  finding: 'lost',
  find: 'lost',
  around: 'lost',
  getting: 'lost',
  metro: 'lost',
  bus: 'lost',
  taxi: 'lost',
  transport: 'lost',
  transit: 'lost',
  navigate: 'lost',
  walk: 'lost',
  free: 'freetime',
  time: 'freetime',
  activity: 'freetime',
  activities: 'freetime',
  bored: 'freetime',
  things: 'freetime',
  do: 'freetime',
  museum: 'freetime',
  park: 'freetime',
  safe: 'safety',
  unsafe: 'safety',
  scared: 'safety',
  wrong: 'safety',
  scam: 'safety',
  suspicious: 'safety',
  pickpocket: 'safety',
  stolen: 'safety',
  emergency: 'emergency',
  police: 'emergency',
  hospital: 'emergency',
  doctor: 'emergency',
  embassy: 'emergency',
  consulate: 'emergency',
  tired: 'tired',
  overwhelm: 'tired',
  overwhelmed: 'tired',
  rest: 'tired',
  break: 'tired',
  quiet: 'tired',
  calm: 'tired',
  phrase: 'language',
  phrases: 'language',
  language: 'language',
  say: 'language',
  speak: 'language',
  order: 'language',
  english: 'language',
  translate: 'language',
  discover: 'discover',
  spontaneous: 'discover',
  local: 'discover',
  hidden: 'discover',
  off: 'discover', // "off the beaten path" etc – short, so only if with others
  toilet: 'toilet',
  bathroom: 'toilet',
  restroom: 'toilet',
  loo: 'toilet',
  wc: 'toilet',
  pharmacy: 'pharmacy',
  medicine: 'pharmacy',
  atm: 'cash',
  cash: 'cash',
  money: 'cash',
};

/**
 * Words that appear in headlines/titles → concept.
 * Used to detect if an index item is “about” a situation.
 */
export const CONTENT_WORD_TO_CONCEPT: Record<string, SituationConcept> = {
  food: 'food',
  eat: 'food',
  eating: 'food',
  meal: 'food',
  restaurant: 'food',
  bite: 'food',
  lunch: 'food',
  dinner: 'food',
  breakfast: 'food',
  café: 'food',
  cafe: 'food',
  coffee: 'food',
  lost: 'lost',
  direction: 'lost',
  around: 'lost',
  getting: 'lost',
  metro: 'lost',
  transport: 'lost',
  taxi: 'lost',
  bus: 'lost',
  free: 'freetime',
  time: 'freetime',
  activity: 'freetime',
  bored: 'freetime',
  safe: 'safety',
  safety: 'safety',
  scam: 'safety',
  suspicious: 'safety',
  off: 'safety', // "something feels off"
  tired: 'tired',
  overwhelm: 'tired',
  rest: 'tired',
  phrase: 'language',
  language: 'language',
  say: 'language',
  order: 'language',
  discover: 'discover',
  spontaneous: 'discover',
  local: 'discover',
  toilet: 'toilet',
  bathroom: 'toilet',
  pharmacy: 'pharmacy',
  medicine: 'pharmacy',
  emergency: 'emergency',
  police: 'emergency',
  hospital: 'emergency',
  atm: 'cash',
  cash: 'cash',
};

/** Strip emoji and extra spaces for concept extraction. */
function toContentWords(s: string): string[] {
  return s
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Get concepts for the query from its tokens.
 */
export function getQueryConcepts(tokens: string[]): Set<SituationConcept> {
  const concepts = new Set<SituationConcept>();
  for (const t of tokens) {
    const c = QUERY_TERM_TO_CONCEPT[t.toLowerCase()];
    if (c) concepts.add(c);
  }
  return concepts;
}

/**
 * Get concepts for an index item from headline + microSituation title.
 */
export function getItemConcepts(headline: string, microSituationTitle: string): Set<SituationConcept> {
  const concepts = new Set<SituationConcept>();
  const words = [...toContentWords(headline), ...toContentWords(microSituationTitle)];
  for (const w of words) {
    const c = CONTENT_WORD_TO_CONCEPT[w];
    if (c) concepts.add(c);
  }
  return concepts;
}

/**
 * True if there is overlap between query and item concepts (situational match).
 */
export function hasSituationalOverlap(
  queryConcepts: Set<SituationConcept>,
  itemConcepts: Set<SituationConcept>
): boolean {
  if (queryConcepts.size === 0 || itemConcepts.size === 0) return false;
  for (const c of queryConcepts) {
    if (itemConcepts.has(c)) return true;
  }
  return false;
}
