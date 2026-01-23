# TTS Example Spoken Response Scripts

## Example 1: Single Result

**Result**:
- Card: 🍽 I Need Food Nearby
- Situation: Quick Bite
- Action: "Boulangerie (bakery): croissant €1-2, sandwich €4-6"

**TTS Script**:
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros, sandwich 4 to 6 euros.
```

## Example 2: Multiple Results

**Query**: "late night food"

**Results** (3 found):
1. Quick Bite - "Food trucks near tourist sites (€8-12)"
2. Sit-Down Meal - "Lunch menu (formule) €12-18 vs dinner €30-50"
3. Dietary Restrictions - "Point at menu if language barrier"

**TTS Script**:
```
Found 3 results for "late night food".

Result 1. I Need Food Nearby. Quick Bite. Food trucks near tourist sites, 8 to 12 euros.

Result 2. I Need Food Nearby. Sit-Down Meal. Lunch menu formule 12 to 18 euros versus dinner 30 to 50 euros.

Result 3. I Need Food Nearby. Dietary Restrictions. Point at menu if language barrier.
```

## Example 3: With Context

**Result**:
- Card: 🧭 I'm Lost / Getting Around
- Situation: I'm Lost
- Action: "Find nearest metro station (look for 'M' signs)"
- Context: { timeOfDay: "late_night", location: "Le Marais" }

**TTS Script**:
```
For late night, in Le Marais, I'm Lost Getting Around. I'm Lost. Find nearest metro station, look for M signs.
```

## Example 4: With Tip

**Result**:
- Card: 🍽 I Need Food Nearby
- Situation: Quick Bite
- Action: "Boulangerie (bakery): croissant €1-2, sandwich €4-6"
- Tip: "Don't eat at tourist trap restaurants. Walk 2 blocks away for better prices."

**TTS Script**:
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros, sandwich 4 to 6 euros. Tip: Don't eat at tourist trap restaurants. Walk 2 blocks away for better prices.
```

## Example 5: Emergency Result

**Query**: "toilet"

**Result**:
- Card: 🚨 Emergency
- Situation: Need Restroom
- Action: "Look for 'WC' signs or ask 'Où sont les toilettes?'"

**TTS Script**:
```
Found 1 result for "toilet".

Result 1. Emergency. Need Restroom. Look for WC signs or ask Où sont les toilettes.
```

## Example 6: Navigation Result

**Query**: "I'm lost"

**Result**:
- Card: 🧭 I'm Lost / Getting Around
- Situation: I'm Lost
- Action: "Find nearest metro station (look for 'M' signs)"
- Tip: "Don't panic - Paris is walkable. Most attractions are within 30min walk of each other."

**TTS Script**:
```
Found 1 result for "I'm lost".

Result 1. I'm Lost Getting Around. I'm Lost. Find nearest metro station, look for M signs. Tip: Don't panic. Paris is walkable. Most attractions are within 30 minutes walk of each other.
```

## Example 7: Long Action (Truncated)

**Result**:
- Action: "Get Navigo Easy card (€2) at any metro station. Single ride €2.10, or carnet of 10 tickets €19.10. Validate ticket before boarding (yellow machines). Metro runs 5:30am-1:15am, buses until 12:30am."

**TTS Script** (truncated to first sentence):
```
Get Navigo Easy card, 2 euros at any metro station.
```

## Example 8: Multiple Results with Pauses

**Query**: "food"

**Results** (5 found):
1. Quick Bite
2. Sit-Down Meal
3. Dietary Restrictions
4. Late Night Options
5. Budget Options

**TTS Script** (with natural pauses):
```
Found 5 results for "food".

Result 1. I Need Food Nearby. Quick Bite. [pause]

Result 2. I Need Food Nearby. Sit-Down Meal. [pause]

Result 3. I Need Food Nearby. Dietary Restrictions. [pause]

Result 4. I Need Food Nearby. Late Night Options. [pause]

Result 5. I Need Food Nearby. Budget Options.
```

## Text Cleaning Examples

### Before Cleaning:
```
🍽 I Need Food Nearby. Quick Bite. Boulangerie (bakery): croissant €1-2, sandwich €4-6. Tip: Don't eat at tourist trap restaurants!
```

### After Cleaning:
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros, sandwich 4 to 6 euros. Tip: Don't eat at tourist trap restaurants.
```

### Currency Conversion:
- `€10` → `10 euros`
- `$20` → `20 dollars`
- `€1-2` → `1 to 2 euros`

### Distance Conversion:
- `5km` → `5 kilometers`
- `100m` → `100 meters`

### Time Format:
- `5:30am` → `5 30 AM`
- `12:30pm` → `12 30 PM`

## Voice States

### Idle
- Button shows: "Listen" icon
- Action: Click to start speaking

### Speaking
- Button shows: Pulsing microphone icon + "Pause"
- Action: Click to pause, double-click to stop

### Paused
- Button shows: Play icon + "Resume"
- Action: Click to resume

### Stopped
- Button shows: "Listen" icon
- Action: Click to restart from beginning

## Best Practices

1. **Keep summaries concise** - Max 150 characters per action
2. **Use natural pauses** - Between results
3. **Clean text** - Remove emojis, fix abbreviations
4. **Truncate long content** - First sentence or 150 chars
5. **Add context** - Time, location when relevant
6. **Include tips** - Brief "whatToDoInstead" when available
