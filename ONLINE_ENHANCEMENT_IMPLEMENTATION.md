# Online Enhancement Implementation

## Overview

Optional online enhancement layer that improves offline search results using AI while strictly adhering to safe-guard rules. Only runs when connectivity is good and never replaces offline results.

## Core Principles

✅ **Only when online** - Enhancement only runs when connectivity is 'online'  
✅ **Never replaces** - Enhances but never replaces offline results  
✅ **Local pack grounding** - All enhancements validated against local pack data  
✅ **Improves ranking, NLU, context** - Can enhance multiple aspects  
✅ **No hallucinations** - No invented locations or results  

## Enhancement Pipeline

### Step 1: Ranking Improvement

**What it does**: Re-ranks results based on better understanding of query intent

**How it works**:
1. Sends local pack data + query to AI
2. AI returns reordered indices based on relevance
3. Results reordered (no new results added)

**Safe-guards**:
- All indices validated to exist
- No new results added
- All results still from local pack

### Step 2: NLU Improvement

**What it does**: Improves relevance scores based on better natural language understanding

**How it works**:
1. Sends query + current results to AI
2. AI returns improved scores with reasons
3. Scores updated (results unchanged)

**Safe-guards**:
- All results validated to exist in pack
- Scores clamped to 0-100
- No results modified beyond scores

### Step 3: Context Improvement

**What it does**: Adds context understanding (time, location, intent)

**How it works**:
1. Sends query + context (time, location) to AI
2. AI returns context improvements
3. Context added to results

**Safe-guards**:
- All locations validated to exist in pack
- No invented locations
- Context only added, not modified

## Safe-guard Rules

### Rule 1: Only Enhance When Online

```typescript
if (connectivityState !== 'online') {
  return originalResults; // No enhancement
}
```

### Rule 2: All Results Must Exist in Pack

```typescript
function validateResultInPack(result: SearchResult, pack: TravelPack): boolean {
  // Check if result exists in pack structure
  return pack.tiers.tier1.cards.some(card => 
    card.headline === result.cardHeadline &&
    card.microSituations.some(ms => 
      ms.title === result.microSituationTitle &&
      ms.actions.includes(result.action)
    )
  );
}
```

### Rule 3: All Locations Must Exist in Pack

```typescript
function validateLocationInPack(location: string, pack: TravelPack): boolean {
  const packContent = JSON.stringify(pack).toLowerCase();
  return packContent.includes(location.toLowerCase());
}
```

### Rule 4: Never Add New Results

```typescript
// Enhanced results must be <= original results
if (enhanced.length > original.length) {
  // Invalid - filter to original length
}
```

### Rule 5: Never Remove Valid Results

```typescript
// All valid original results must be in enhanced
const originalIds = new Set(original.map(r => r.id));
const enhancedIds = new Set(enhanced.map(r => r.id));

for (const id of originalIds) {
  if (!enhancedIds.has(id)) {
    // Invalid - result was removed
  }
}
```

## Usage

### Basic Enhancement

```typescript
import { integratedSearch } from '@/lib/enhancementIntegration';

const { immediateResults, enhancementPromise } = await integratedSearch(
  'Paris',
  'late night food',
  {
    enableEnhancement: true,
    limit: 10,
  }
);

// Show immediate results
console.log(immediateResults);

// Wait for enhancement (optional)
const enhanced = await enhancementPromise;
console.log(enhanced);
```

### With Options

```typescript
const { immediateResults, enhancementPromise } = await integratedSearch(
  'Paris',
  'restaurants',
  {
    enableEnhancement: true,
    enhancementOptions: {
      enableRankingImprovement: true,
      enableNLUImprovement: true,
      enableContextImprovement: true,
      maxEnhancementTime: 2000,
      apiEndpoint: 'https://api.example.com/enhance',
      apiKey: 'your-api-key',
    },
    onEnhancementComplete: (enhanced) => {
      console.log('Enhancement complete:', enhanced);
    },
  }
);
```

## Example: Offline → Enhanced Upgrade

### Before Enhancement (Offline)

```
Query: "late night food"

Results:
1. Quick Bite (Score: 30)
   - Match: keyword "food"
   
2. Sit-Down Meal (Score: 25)
   - Match: keyword "food"
   
3. Dietary Restrictions (Score: 20)
   - Match: keyword "food"
```

### After Enhancement (Online)

```
Query: "late night food"

Results:
1. Quick Bite (Score: 85) ✨
   - Original: 30 → Enhanced: 85
   - Reason: "Better match for late night food query"
   - Context: { timeOfDay: "late_night", intent: "finding food" }
   
2. Sit-Down Meal (Score: 45) ✨
   - Original: 25 → Enhanced: 45
   - Reason: "Relevant but less urgent for late night"
   - Context: { timeOfDay: "evening", intent: "dining" }
   
3. Dietary Restrictions (Score: 20)
   - Not enhanced (low relevance)
```

## Enhancement Types

### Ranking Improvement

**Input**: Query + current results  
**Output**: Reordered results  
**Improves**: Result order based on relevance  

**Example**:
- Offline: [Result A (30), Result B (25), Result C (20)]
- Enhanced: [Result B (25), Result A (30), Result C (20)]
- Reason: Result B better matches query intent

### NLU Improvement

**Input**: Query + current results + scores  
**Output**: Improved scores + reasons  
**Improves**: Relevance scores based on better understanding  

**Example**:
- Offline: Score 30
- Enhanced: Score 85
- Reason: "Better match for late night food query"

### Context Improvement

**Input**: Query + context (time, location)  
**Output**: Context improvements  
**Improves**: Time relevance, location context, intent understanding  

**Example**:
- Context: { timeOfDay: "late_night", location: "Le Marais", intent: "finding food" }
- Validated: Location "Le Marais" exists in pack ✓

## API Integration

### Placeholder Implementation

The current implementation includes a placeholder `callEnhancementAPI` function. To use actual AI services:

```typescript
async function callEnhancementAPI(prompt: string, options: EnhancementOptions) {
  // Example: OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a travel search assistant. Only use data from the provided pack.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

## Performance

- **Enhancement time**: 500-2000ms (async, non-blocking)
- **Timeout**: 2000ms max
- **Fallback**: Returns original results if enhancement fails/times out
- **No blocking**: Enhancement never delays initial results

## Error Handling

### Enhancement Fails

- Returns original results
- Logs warning
- No user-facing error

### Enhancement Timeout

- Returns original results
- Logs timeout warning
- No user-facing error

### Invalid Results

- Filters out invalid results
- Logs warning
- Returns only valid results

## Files

- `src/lib/onlineEnhancement.ts` - Enhancement pipeline
- `src/lib/enhancementIntegration.ts` - Integration with search
- `src/lib/enhancementExample.ts` - Usage examples
- `ONLINE_ENHANCEMENT_IMPLEMENTATION.md` - This file

## Testing

### Manual Testing

1. Test with good connection (should enhance)
2. Test with poor connection (should not enhance)
3. Test offline (should not enhance)
4. Test with invalid API (should fallback gracefully)
5. Test with timeout (should return original results)

### Validation Tests

- ✅ All results exist in pack
- ✅ No new results added
- ✅ No valid results removed
- ✅ All locations validated
- ✅ Scores within valid range (0-100)
