# Transcript Normalization Implementation

## Overview

A thin layer between voice transcript and search that normalizes and cleans transcripts to handle:
- Filler words ("um", "uh", "like", "you know")
- Meta phrases ("can you", "please", "i think")
- Accidental speech
- Voice recognition artifacts

## Problem

**Voice transcripts ≠ structured search queries**

Users say:
- "um, like, where can I, you know, eat food?"
- "can you please find me a restaurant?"
- "i think i need to find, uh, food nearby"

But search expects:
- "where eat food"
- "restaurant"
- "food nearby"

## Solution

### Step 1: Stop Word Removal

```typescript
const STOP_WORDS = [
  "the", "a", "an", "is", "right", "now",
  "change", "system", "please", "can", "you",
  "i", "me", "my", "we", "um", "uh", "like",
  // ... 50+ stop words
]
```

### Step 2: Extract Query Tokens

```typescript
function extractQueryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(' ')
    .filter(word => !STOP_WORDS.includes(word))
    .filter(word => word.length > 1)
}
```

### Step 3: Normalize Transcript

```typescript
function normalizeTranscript(transcript: string): string {
  const tokens = extractQueryTokens(transcript);
  return tokens.join(' ');
}
```

### Step 4: Extract Search Intent

```typescript
function extractSearchIntent(transcript: string): string {
  // Clean and normalize
  const cleaned = cleanTranscript(transcript);
  
  // Return meaningful query
  return cleaned;
}
```

## Integration

### In Voice Input Handler

```typescript
onTranscript={(transcript) => {
  // Normalize transcript
  const normalizedQuery = extractSearchIntent(transcript);
  
  // Use normalized query for search
  if (hasMeaningfulContent(transcript)) {
    setQuery(normalizedQuery);
  }
}}
```

### In Search Functions

```typescript
// Normalize before searching
const normalizedQuery = extractSearchIntent(query);
const signalCheck = checkTravelSignal(normalizedQuery || query);
// Use normalized query for search
```

## Examples

### Example 1: Filler Words

**Input**: "um, like, where can I eat food?"  
**Normalized**: "where eat food"  
**Search**: Proceeds with "where eat food"

### Example 2: Meta Phrases

**Input**: "can you please find me a restaurant?"  
**Normalized**: "find restaurant"  
**Search**: Proceeds with "find restaurant"

### Example 3: Accidental Speech

**Input**: "i think i need to, uh, find food nearby"  
**Normalized**: "need find food nearby"  
**Search**: Proceeds with "need find food nearby"

### Example 4: Clean Query

**Input**: "late night food"  
**Normalized**: "late night food"  
**Search**: Proceeds unchanged

## Error Handling

### Async Listener Error Suppression

The async listener error from Chrome extensions/Speech API is now suppressed:

```typescript
// Suppress async listener errors (non-critical)
if (errorMessage.includes('listener') || errorMessage.includes('message channel')) {
  console.warn('Speech API internal error (non-critical):', errorMessage);
  return; // Don't show to user
}
```

**Why**: These errors come from:
- Chrome extensions (Grammarly, etc.)
- Speech API internals
- Background listeners
- Not from our code

**Solution**: Suppress and log, don't break user experience

## Files

- `src/lib/transcriptNormalizer.ts` - Core normalization logic
- `src/components/OfflineSearch.tsx` - Integration in UI
- `src/lib/offlineSearch.ts` - Integration in search
- `src/lib/offlineFallbackSearch.ts` - Integration in fallback search
- `src/lib/useVoiceInput.ts` - Error handling for async listener errors

## Benefits

1. **Better search results** - Removes noise from transcripts
2. **Handles natural speech** - Works with how people actually talk
3. **Suppresses errors** - Async listener errors don't break UX
4. **Improves intelligence** - App feels smarter

## Testing

### Test Cases

1. **Filler words**: "um like food" → "food" ✅
2. **Meta phrases**: "can you find restaurant" → "find restaurant" ✅
3. **Clean query**: "late night food" → "late night food" ✅
4. **Empty after normalization**: "um uh" → Handled gracefully ✅
