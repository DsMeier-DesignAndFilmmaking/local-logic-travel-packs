/**
 * Conversion Utility: Existing Travel Pack Format → Offline-First Format
 * 
 * Converts the current tier-based structure to the new offline-first schema
 * optimized for voice queries.
 */

import { TravelPack, ProblemCard, MicroSituation } from './travelPacks';
import { OfflineFirstPackEntry, OfflineFirstTravelPack, TimeOfDay, UrgencyLevel } from './offlineFirstSchema';

/**
 * Map card headlines to tags
 */
function headlineToTags(headline: string): string[] {
  const tags: string[] = [];
  const headlineLower = headline.toLowerCase();
  
  // Extract emoji if present
  const emojiMatch = headline.match(/[\p{Emoji}]/u);
  if (emojiMatch) {
    tags.push('has-icon');
  }
  
  // Common tag mappings
  if (headlineLower.includes('food') || headlineLower.includes('eat') || headlineLower.includes('🍽')) {
    tags.push('food');
  }
  if (headlineLower.includes('lost') || headlineLower.includes('around') || headlineLower.includes('🧭')) {
    tags.push('navigation');
    tags.push('getting-around');
  }
  if (headlineLower.includes('time') || headlineLower.includes('free') || headlineLower.includes('⏱')) {
    tags.push('activities');
    tags.push('time-management');
  }
  if (headlineLower.includes('unsafe') || headlineLower.includes('off') || headlineLower.includes('😬')) {
    tags.push('safety');
    tags.push('emergency');
  }
  if (headlineLower.includes('say') || headlineLower.includes('🗣')) {
    tags.push('language');
    tags.push('communication');
  }
  if (headlineLower.includes('tired') || headlineLower.includes('overwhelmed') || headlineLower.includes('💤')) {
    tags.push('wellbeing');
    tags.push('rest');
  }
  if (headlineLower.includes('surprise') || headlineLower.includes('🎲')) {
    tags.push('spontaneity');
    tags.push('discovery');
  }
  
  return tags;
}

/**
 * Infer urgency from card headline and microSituation
 */
function inferUrgency(headline: string, microSituation: MicroSituation): UrgencyLevel {
  const combined = `${headline} ${microSituation.title}`.toLowerCase();
  
  if (combined.includes('emergency') || 
      combined.includes('unsafe') || 
      combined.includes('danger') ||
      combined.includes('police') ||
      combined.includes('ambulance')) {
    return 'emergency';
  }
  
  if (combined.includes('hungry') || 
      combined.includes('tired') || 
      combined.includes('lost') ||
      combined.includes('urgent') ||
      combined.includes('need')) {
    return 'urgent';
  }
  
  if (combined.includes('avoid') || 
      combined.includes('mistake') || 
      combined.includes('tip')) {
    return 'important';
  }
  
  return 'helpful';
}

/**
 * Infer time of day from content
 */
function inferTimeOfDay(microSituation: MicroSituation, actions: string[]): TimeOfDay[] {
  const combined = `${microSituation.title} ${actions.join(' ')}`.toLowerCase();
  const times: TimeOfDay[] = [];
  
  if (combined.includes('late night') || 
      combined.includes('midnight') || 
      combined.includes('after 10') ||
      combined.includes('after hours')) {
    times.push('late_night');
    times.push('night');
  }
  
  if (combined.includes('morning') || combined.includes('breakfast') || combined.includes('early')) {
    times.push('early_morning');
    times.push('morning');
  }
  
  if (combined.includes('lunch') || combined.includes('afternoon')) {
    times.push('afternoon');
  }
  
  if (combined.includes('dinner') || combined.includes('evening')) {
    times.push('evening');
  }
  
  // If no time-specific content, mark as anytime
  if (times.length === 0) {
    times.push('anytime');
  }
  
  return times;
}

/**
 * Generate spoken phrases from microSituation
 */
function generateSpokenPhrases(card: ProblemCard, microSituation: MicroSituation): string[] {
  const phrases: string[] = [];
  
  // Use microSituation title as base
  phrases.push(`I need ${microSituation.title.toLowerCase()}`);
  phrases.push(microSituation.title);
  
  // Generate variations from card headline
  const headline = card.headline.toLowerCase();
  if (headline.includes('food')) {
    phrases.push("I'm hungry");
    phrases.push("Where can I eat");
    phrases.push("I need food");
  }
  if (headline.includes('lost')) {
    phrases.push("I'm lost");
    phrases.push("How do I get around");
    phrases.push("I need directions");
  }
  if (headline.includes('time')) {
    phrases.push("What should I do");
    phrases.push("I have free time");
    phrases.push("What's nearby");
  }
  if (headline.includes('unsafe')) {
    phrases.push("I feel unsafe");
    phrases.push("Is this area safe");
    phrases.push("I need help");
  }
  if (headline.includes('say')) {
    phrases.push("I don't know what to say");
    phrases.push("How do I communicate");
    phrases.push("Language help");
  }
  if (headline.includes('tired')) {
    phrases.push("I'm tired");
    phrases.push("I need to rest");
    phrases.push("I'm overwhelmed");
  }
  
  return phrases;
}

/**
 * Generate keywords from content
 */
function generateKeywords(card: ProblemCard, microSituation: MicroSituation, actions: string[]): string[] {
  const keywords = new Set<string>();
  
  // Extract key terms from actions
  actions.forEach(action => {
    const words = action.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['the', 'and', 'for', 'with', 'from', 'that', 'this'].includes(w));
    
    words.forEach(word => keywords.add(word));
  });
  
  // Add common synonyms
  if (microSituation.title.toLowerCase().includes('food')) {
    keywords.add('restaurant');
    keywords.add('dining');
    keywords.add('meal');
    keywords.add('eat');
  }
  if (microSituation.title.toLowerCase().includes('lost')) {
    keywords.add('navigation');
    keywords.add('directions');
    keywords.add('map');
    keywords.add('location');
  }
  
  return Array.from(keywords);
}

/**
 * Convert a single microSituation to an offline-first entry
 */
function convertMicroSituationToEntry(
  city: string,
  country: string,
  card: ProblemCard,
  microSituation: MicroSituation,
  entryIndex: number
): OfflineFirstPackEntry {
  const actions = microSituation.actions || [];
  const content = actions.join('\n\n');
  
  const tags = headlineToTags(card.headline);
  const urgency = inferUrgency(card.headline, microSituation);
  const timeOfDay = inferTimeOfDay(microSituation, actions);
  const spokenPhrases = generateSpokenPhrases(card, microSituation);
  const keywords = generateKeywords(card, microSituation, actions);
  
  // Generate ID
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const cardSlug = card.headline
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 30);
  const microSlug = microSituation.title
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  const id = `${citySlug}-${cardSlug}-${microSlug}-${entryIndex.toString().padStart(3, '0')}`;
  
  // Calculate priority score based on urgency
  const priorityScores: Record<UrgencyLevel, number> = {
    emergency: 90,
    urgent: 70,
    important: 50,
    helpful: 30
  };
  
  const entry: OfflineFirstPackEntry = {
    id,
    city,
    country,
    title: microSituation.title,
    content,
    problem_it_solves: `${card.headline}: ${microSituation.title}`,
    tags,
    time_of_day: timeOfDay,
    spoken_phrases: spokenPhrases,
    keywords,
    urgency,
    priority_score: priorityScores[urgency],
    version: '1.0.0'
  };
  
  // Add whatToDoInstead as warnings if present
  if (microSituation.whatToDoInstead) {
    entry.warnings = [microSituation.whatToDoInstead];
  }
  
  return entry;
}

/**
 * Convert existing TravelPack to OfflineFirstTravelPack
 */
export function convertToOfflineFirst(pack: TravelPack): OfflineFirstTravelPack {
  const entries: OfflineFirstPackEntry[] = [];
  let entryIndex = 0;
  
  // Convert Tier 1 (most important, always available offline)
  if (pack.tiers.tier1) {
    pack.tiers.tier1.cards.forEach(card => {
      card.microSituations.forEach(microSituation => {
        const entry = convertMicroSituationToEntry(
          pack.city,
          pack.country,
          card,
          microSituation,
          entryIndex++
        );
        entries.push(entry);
      });
    });
  }
  
  // Convert Tier 2 (city-specific)
  if (pack.tiers.tier2) {
    pack.tiers.tier2.cards.forEach(card => {
      card.microSituations.forEach(microSituation => {
        const entry = convertMicroSituationToEntry(
          pack.city,
          pack.country,
          card,
          microSituation,
          entryIndex++
        );
        // Tier 2 entries have slightly lower priority
        entry.priority_score = Math.max(1, entry.priority_score - 10);
        entries.push(entry);
      });
    });
  }
  
  // Convert Tier 3 (contextual)
  if (pack.tiers.tier3) {
    pack.tiers.tier3.cards.forEach(card => {
      card.microSituations.forEach(microSituation => {
        const entry = convertMicroSituationToEntry(
          pack.city,
          pack.country,
          card,
          microSituation,
          entryIndex++
        );
        // Tier 3 entries have lower priority
        entry.priority_score = Math.max(1, entry.priority_score - 20);
        entries.push(entry);
      });
    });
  }
  
  // Build search index
  const searchIndex = {
    by_time_of_day: {} as Record<TimeOfDay, string[]>,
    by_tag: {} as Record<string, string[]>,
    by_urgency: {} as Record<UrgencyLevel, string[]>,
    by_neighborhood: {} as Record<string, string[]>
  };
  
  entries.forEach(entry => {
    // Index by time of day
    entry.time_of_day.forEach(time => {
      if (!searchIndex.by_time_of_day[time]) {
        searchIndex.by_time_of_day[time] = [];
      }
      searchIndex.by_time_of_day[time].push(entry.id);
    });
    
    // Index by tag
    entry.tags.forEach(tag => {
      if (!searchIndex.by_tag[tag]) {
        searchIndex.by_tag[tag] = [];
      }
      searchIndex.by_tag[tag].push(entry.id);
    });
    
    // Index by urgency
    if (!searchIndex.by_urgency[entry.urgency]) {
      searchIndex.by_urgency[entry.urgency] = [];
    }
    searchIndex.by_urgency[entry.urgency].push(entry.id);
    
    // Index by neighborhood
    if (entry.neighborhood) {
      if (!searchIndex.by_neighborhood[entry.neighborhood]) {
        searchIndex.by_neighborhood[entry.neighborhood] = [];
      }
      searchIndex.by_neighborhood[entry.neighborhood].push(entry.id);
    }
  });
  
  return {
    city: pack.city,
    country: pack.country,
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    entries,
    search_index: searchIndex
  };
}
