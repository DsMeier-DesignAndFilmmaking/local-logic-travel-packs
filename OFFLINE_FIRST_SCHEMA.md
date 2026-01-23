# Offline-First Travel Pack Data Model

## Core Principles

1. **Voice must always work** - Offline STT first, online enhancement optional
2. **Intelligence gracefully degrades** - Works offline, better online
3. **Offline functionality is never blocked** - No hard failures when internet is poor/unavailable
4. **Local pack data is always the source of truth** - Online AI enhances but never replaces

## Design Rules

- Voice capture is always available (offline STT first)
- Local pack data is always the source of truth
- Online AI enhances results but never replaces offline access
- No hard failures when internet is poor or unavailable

## Schema Overview

The offline-first data model is optimized for:
- **Voice-based queries** (natural spoken language prioritized)
- **Fast local search** (fuzzy matching, keyword indexing)
- **Offline functionality** (fully usable without internet)
- **Human spoken language** (not SEO-optimized)

## Data Structure

### Entry Fields

Each pack entry includes:

- **id**: Unique identifier (e.g., `"paris-late-night-food-001"`)
- **title**: Human-readable title
- **content**: Primary guidance/answer
- **tags**: Categories for filtering
- **problem_it_solves**: What problem this entry solves
- **time_of_day**: When this entry is relevant (`early_morning`, `morning`, `afternoon`, `evening`, `late_night`, `night`, `anytime`)
- **neighborhood/area**: Location context
- **spoken_phrases**: Natural voice queries travelers might say
- **keywords**: For fuzzy matching (variations, synonyms, misspellings)
- **urgency**: `emergency` | `urgent` | `important` | `helpful`
- **priority_score**: 1-100 for ranking

### Optional Fields

- **alternatives**: Alternative solutions
- **warnings**: Things to avoid
- **cost_range**: `free` | `budget` | `moderate` | `expensive`
- **accessibility**: Accessibility notes

## File Formats

### JSON Format

Primary format for web/JavaScript applications. See `data/offlineFirstExamples.json` for examples.

**Advantages:**
- Easy to parse in JavaScript/TypeScript
- Human-readable
- Works with localStorage/IndexedDB
- No database setup required

### SQLite Format

Alternative format for native mobile apps or when you need relational queries. See `data/offlineFirstSchema.sql` for schema.

**Advantages:**
- Fast relational queries
- ACID transactions
- Better for complex filtering
- Native mobile app support

## Voice Search Implementation

The `voiceSearch.ts` module provides:

- **Fuzzy matching** on spoken phrases and keywords
- **Time-of-day filtering** (automatic or manual)
- **Urgency-based ranking** (emergency entries rank higher)
- **Location filtering** (neighborhood/area)
- **Relevance scoring** (0-100)

### Example Usage

```typescript
import { searchVoiceQuery, getCurrentTimeOfDay } from '@/lib/voiceSearch';
import { OfflineFirstTravelPack } from '@/lib/offlineFirstSchema';

const pack: OfflineFirstTravelPack = /* load from JSON */;

// Search with voice query
const results = searchVoiceQuery(pack, {
  query: "I'm hungry late at night",
  city: "Paris",
  time_of_day: getCurrentTimeOfDay(), // or 'late_night'
  limit: 5
});

// Results are sorted by relevance score
results.forEach(result => {
  console.log(result.entry.title);
  console.log(`Relevance: ${result.relevance_score}`);
  console.log(`Match reasons: ${result.match_reason.join(', ')}`);
});
```

## Example Entries

Three example entries are provided in `data/offlineFirstExamples.json`:

1. **Late-night food** (`paris-late-night-food-001`)
   - Solves: Finding food when restaurants are closed
   - Time: `late_night`, `night`
   - Urgency: `urgent`

2. **Avoiding tourist traps** (`paris-avoid-tourist-traps-001`)
   - Solves: Finding authentic, reasonably-priced restaurants
   - Time: `anytime`
   - Urgency: `important`

3. **Feeling unsafe at night** (`paris-feel-unsafe-night-001`)
   - Solves: Safety concerns in unfamiliar city
   - Time: `late_night`, `night`
   - Urgency: `emergency`

## Search Index

The schema includes an optional `search_index` for O(1) lookups:

```json
{
  "search_index": {
    "by_time_of_day": { "late_night": ["entry-id-1", "entry-id-2"] },
    "by_tag": { "food": ["entry-id-1"] },
    "by_urgency": { "emergency": ["entry-id-3"] },
    "by_neighborhood": { "Le Marais": ["entry-id-1"] }
  }
}
```

This enables fast filtering before running full-text search.

## Best Practices

### Writing Spoken Phrases

- Use natural, conversational language
- Include variations of how people might ask
- Think about what travelers actually say, not SEO keywords
- Examples:
  - ✅ "I'm hungry late at night"
  - ✅ "Where can I eat after midnight"
  - ❌ "late night dining paris restaurants"

### Writing Keywords

- Include synonyms and variations
- Include common misspellings
- Include related terms
- Examples:
  - `["late night", "midnight", "after hours", "24 hour", "open late"]`

### Setting Priority Scores

- Emergency situations: 90-100
- Urgent needs: 70-89
- Important tips: 50-69
- Helpful info: 30-49
- Nice-to-know: 1-29

### Time of Day Relevance

- Be specific when possible (not always `anytime`)
- Consider timezone context
- Include multiple relevant times if applicable
- Example: Late-night food is relevant for both `late_night` and `night`

## Migration from Existing Format

The existing tier-based format can be converted to this schema. Key mappings:

- **Cards → Entries**: Each microSituation becomes an entry
- **Actions → Content**: Actions become the primary content
- **Headlines → Tags**: Card headlines become tags
- **whatToDoInstead → Warnings**: Convert to warnings array

See conversion utilities for automated migration.

## Performance Considerations

- **JSON size**: Keep entries concise but complete
- **Index size**: Pre-compute indexes for faster filtering
- **Search speed**: Use indexes to filter before full-text search
- **Storage**: Compress JSON for download, decompress on device

## Offline Storage

For web apps:
- Use `localStorage` for small packs (< 5MB)
- Use `IndexedDB` for larger packs
- Pre-load Tier 1 (free) content on app install

For mobile apps:
- Use SQLite database
- Bundle base pack with app
- Sync updates when online
