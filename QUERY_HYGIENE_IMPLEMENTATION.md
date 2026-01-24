# Query Hygiene Implementation

## Overview

Added query hygiene layer to handle voice transcripts that contain only filler words or have no meaningful tokens after normalization.

## Problem

Voice transcripts often contain:
- Only filler words: "um, uh, like, you know"
- Meta phrases: "can you please"
- Accidental speech

These should not trigger searches - instead, show helpful voice hints.

## Solution

### Step 1: Token Extraction ✅

```typescript
const tokens = extractQueryTokens(query);
// Returns: ["eat", "late", "tonight"] from "Where can I eat late tonight"
```

### Step 2: Only Search If Tokens Remain ✅

```typescript
if (tokens.length === 0) {
  return showVoiceHintUI();
}
```

### Step 3: Updated "No Results" Message ✅

**Before**: "No results found for X"

**After**: "Try asking about food, places, or things to do nearby."

This keeps trust intact and provides helpful guidance.

## Implementation

### Files Modified

1. **`src/lib/transcriptNormalizer.ts`**
   - Added `hasSearchableTokens()` function
   - Updated `hasMeaningfulContent()` to use token count

2. **`src/lib/offlineSearch.ts`**
   - Added token check before searching
   - Returns empty array if no tokens remain

3. **`src/lib/offlineFallbackSearch.ts`**
   - Added token check before searching
   - Returns voice hint message if no tokens

4. **`src/components/OfflineSearch.tsx`**
   - Added `showVoiceHint` state
   - Shows voice hint UI when no tokens remain
   - Updated "No results" message to be more helpful

## Flow

### Normal Query Flow

1. User says: "Where can I eat late tonight"
2. Extract tokens: `["eat", "late", "tonight"]`
3. Tokens exist → Proceed to search
4. Show results or helpful message

### Filler-Only Query Flow

1. User says: "um, uh, like, you know"
2. Extract tokens: `[]` (empty)
3. No tokens → Show voice hint UI
4. Display: "Try asking about food, places, or things to do nearby."

## Examples

### Example 1: "late night food"

**Transcript**: "late night food"  
**Tokens**: `["late", "night", "food"]`  
**Result**: ✅ Search proceeds normally

### Example 2: "quiet coffee"

**Transcript**: "quiet coffee"  
**Tokens**: `["quiet", "coffee"]`  
**Result**: ✅ Search proceeds normally

### Example 3: "is this area safe at night"

**Transcript**: "is this area safe at night"  
**Tokens**: `["area", "safe", "night"]` (stop words removed)  
**Result**: ✅ Search proceeds normally

### Example 4: "um, uh, like"

**Transcript**: "um, uh, like"  
**Tokens**: `[]` (all stop words)  
**Result**: 🎤 Show voice hint UI

### Example 5: "can you please"

**Transcript**: "can you please"  
**Tokens**: `[]` (all stop words)  
**Result**: 🎤 Show voice hint UI

## UI States

### Voice Hint UI

Shown when no tokens remain after normalization:
- Microphone icon
- Message: "Try asking about food, places, or things to do nearby."
- Examples: "late night food", "I'm lost", "toilet nearby", "quiet coffee"

### No Results UI

Shown when search completes but finds no results:
- Search icon
- Message: "Try asking about food, places, or things to do nearby."
- Examples: "late night food", "quiet coffee", "is this area safe at night"

## Testing Checklist

✅ **Stop-word removal** - Filler words are filtered out  
✅ **Travel-signal guard** - Non-travel queries show helpful message  
✅ **Default offline fallback results** - Suggestions shown when appropriate  
✅ **Test queries**:
- "late night food" → Should search
- "quiet coffee" → Should search
- "is this area safe at night" → Should search
- "um, uh, like" → Should show voice hint
- "can you please" → Should show voice hint

✅ **Airplane mode** - All functionality works offline

## What NOT to Do

❌ Don't add AI  
❌ Don't add embeddings  
❌ Don't assume transcript is wrong  
❌ Don't over-debug the async error

**Focus**: Query hygiene, not intelligence.

## Benefits

1. **Better UX** - No confusing "No results" for filler-only queries
2. **Helpful guidance** - Users get suggestions instead of dead ends
3. **Trust building** - App feels smarter and more helpful
4. **Offline-first** - All functionality works without internet

## Next Steps

The query hygiene layer is complete. The app now:
- Normalizes transcripts properly
- Only searches when meaningful tokens exist
- Shows helpful hints instead of errors
- Works fully offline

Ready for testing with real voice queries!
