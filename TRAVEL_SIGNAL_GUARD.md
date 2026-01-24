# Travel Signal Guard Implementation

## Overview

A guard that checks if queries contain travel-related signal before searching. Prevents showing "No results found" for non-travel queries and instead provides helpful guidance.

## Purpose

**Before**: Non-travel queries → "No results found" (feels broken)  
**After**: Non-travel queries → "Try asking about food, places, or things to do nearby" (feels intelligent)

## Implementation

### Step A: Travel Keywords

Defined in `src/lib/travelSignalGuard.ts`:

```typescript
const TRAVEL_KEYWORDS = [
  "eat", "food", "restaurant", "bar", "drink",
  "coffee", "cafe", "museum", "walk", "park",
  "safe", "unsafe", "night", "late",
  "local", "tourist", "area", "neighborhood",
  // ... and more
]
```

### Step B: Signal Detection

```typescript
function hasTravelSignal(query: string): boolean {
  return TRAVEL_KEYWORDS.some(keyword =>
    query.includes(keyword)
  )
}
```

### Step C: Guard Integration

Applied before search in:
- `searchOffline()` - Basic offline search
- `fallbackSearch()` - Fallback search with enhanced matching
- `OfflineSearchEngine.search()` - Search engine class

## Behavior

### When Travel Signal Detected

**Query**: "late night food"  
**Result**: Normal search proceeds  
**Output**: Search results from pack

### When No Travel Signal Detected

**Query**: "what is the weather"  
**Result**: Guard triggers fallback  
**Output**: 
- Message: "Try asking about food, places, or things to do nearby."
- Suggestions: Helpful examples of travel-related queries

## Fallback Response

When no travel signal is detected:

```typescript
{
  type: "fallback",
  message: "Try asking about food, places, or things to do nearby.",
  results: [
    {
      cardHeadline: "💡 Try asking about:",
      microSituationTitle: "Food & Dining",
      action: "Ask: 'Where can I eat?' or 'Late night food'",
    },
    // ... more suggestions
  ]
}
```

## UX Impact

### Before Guard
```
User: "what is the weather"
App: "No results found for 'what is the weather'"
User: 😞 (feels broken)
```

### After Guard
```
User: "what is the weather"
App: "Try asking about food, places, or things to do nearby."
     [Helpful suggestions displayed]
User: 😊 (feels intelligent, gets guidance)
```

## Integration Points

1. **`src/lib/travelSignalGuard.ts`** - Core guard logic
2. **`src/lib/offlineSearch.ts`** - Basic search integration
3. **`src/lib/offlineFallbackSearch.ts`** - Fallback search integration
4. **`src/lib/offlineSearchEngine.ts`** - Search engine integration
5. **`src/components/OfflineSearch.tsx`** - UI message display

## Testing

### Test Cases

1. **Travel query** → Should proceed normally
   - "late night food" ✅
   - "I'm lost" ✅
   - "toilet nearby" ✅

2. **Non-travel query** → Should show fallback
   - "what is the weather" → Fallback ✅
   - "how are you" → Fallback ✅
   - "random text" → Fallback ✅

3. **Edge cases**
   - Empty query → No guard check
   - Very short query → Guard check
   - Query with partial match → Guard check

## Keywords List

The guard uses 50+ travel-related keywords covering:
- Food & dining
- Navigation & directions
- Safety & emergency
- Transportation
- Places & attractions
- Communication
- Time & activities
- Common travel questions

## Performance

- **Check time**: <1ms (simple string includes)
- **No network calls**: Pure local check
- **No impact on search**: Only runs before search

## Future Enhancements

- [ ] Machine learning-based signal detection
- [ ] Context-aware signal detection
- [ ] Multi-language keyword support
- [ ] User feedback to improve keywords
