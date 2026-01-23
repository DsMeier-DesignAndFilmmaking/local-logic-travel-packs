# TTS Voice UX States

## State Definitions

### State: `idle`

**Visual**:
- Icon: 🔊 Speaker icon
- Text: "Listen"
- Style: White background, gray border

**Behavior**:
- Click: Starts speaking
- Double-click: No action

**Accessibility**:
- Announcement: "Text-to-speech ready. Click to listen to results."

---

### State: `speaking`

**Visual**:
- Icon: 🎤 Pulsing microphone icon
- Text: "Pause"
- Style: Green background, green border
- Indicator: Pulsing green dot in corner

**Behavior**:
- Click: Pauses speech
- Double-click: Stops speech

**Accessibility**:
- Announcement: "Speaking results. Click to pause."
- Live region: Updates with current text being spoken

---

### State: `paused`

**Visual**:
- Icon: ▶️ Play icon
- Text: "Resume"
- Style: Green background, green border

**Behavior**:
- Click: Resumes speech from where paused
- Double-click: Stops speech

**Accessibility**:
- Announcement: "Speech paused. Click to resume."

---

### State: `stopped`

**Visual**:
- Icon: 🔊 Speaker icon
- Text: "Listen"
- Style: White background, gray border

**Behavior**:
- Click: Restarts from beginning
- Double-click: No action

**Accessibility**:
- Announcement: "Speech stopped. Click to restart."

---

## State Transitions

```
idle
  ↓ (click)
speaking
  ↓ (click)
paused
  ↓ (click)
speaking
  ↓ (double-click)
stopped
  ↓ (click)
speaking (from beginning)

Alternative:
speaking
  ↓ (double-click)
stopped
  ↓ (click)
speaking (from beginning)
```

## Visual Indicators

### Speaking Indicator
- **Location**: Top-right corner of button
- **Style**: Pulsing green dot
- **Animation**: Continuous pulse
- **Size**: 12px circle

### Button States

| State | Background | Border | Icon | Text |
|-------|-----------|--------|------|------|
| idle | White | Gray | 🔊 | "Listen" |
| speaking | Green (#F0FDF4) | Green | 🎤 (pulsing) | "Pause" |
| paused | Green (#F0FDF4) | Green | ▶️ | "Resume" |
| stopped | White | Gray | 🔊 | "Listen" |

## Interaction Patterns

### Single Click
- **idle → speaking**: Start playback
- **speaking → paused**: Pause playback
- **paused → speaking**: Resume playback
- **stopped → speaking**: Restart from beginning

### Double Click
- **speaking → stopped**: Stop and reset
- **paused → stopped**: Stop and reset
- **stopped → idle**: No action (already stopped)

### Keyboard
- **Space/Enter**: Toggle play/pause
- **Escape**: Stop and reset
- **Tab**: Focus button

## Example Spoken Response Scripts

### Example 1: Single Result

**Input**:
```typescript
{
  cardHeadline: "🍽 I Need Food Nearby",
  microSituationTitle: "Quick Bite",
  action: "Boulangerie (bakery): croissant €1-2, sandwich €4-6"
}
```

**TTS Output**:
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros, sandwich 4 to 6 euros.
```

### Example 2: Multiple Results

**Input**:
- Query: "late night food"
- Results: 3 found

**TTS Output**:
```
Found 3 results for "late night food".

Result 1. I Need Food Nearby. Quick Bite. Food trucks near tourist sites, 8 to 12 euros.

Result 2. I Need Food Nearby. Sit-Down Meal. Lunch menu formule 12 to 18 euros versus dinner 30 to 50 euros.

Result 3. I Need Food Nearby. Dietary Restrictions. Point at menu if language barrier.
```

### Example 3: With Tip

**Input**:
```typescript
{
  cardHeadline: "🍽 I Need Food Nearby",
  microSituationTitle: "Quick Bite",
  action: "Boulangerie (bakery): croissant €1-2",
  whatToDoInstead: "Don't eat at tourist trap restaurants. Walk 2 blocks away for better prices."
}
```

**TTS Output**:
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros. Tip: Don't eat at tourist trap restaurants. Walk 2 blocks away for better prices.
```

### Example 4: Emergency Result

**Input**:
- Query: "toilet"
- Result: Emergency card

**TTS Output**:
```
Found 1 result for "toilet".

Result 1. Emergency. Need Restroom. Look for WC signs or ask Où sont les toilettes.
```

### Example 5: Navigation Result

**Input**:
- Query: "I'm lost"
- Result: Navigation card

**TTS Output**:
```
Found 1 result for "I'm lost".

Result 1. I'm Lost Getting Around. I'm Lost. Find nearest metro station, look for M signs. Tip: Don't panic. Paris is walkable. Most attractions are within 30 minutes walk of each other.
```

## Text Cleaning Examples

### Before Cleaning
```
🍽 I Need Food Nearby. Quick Bite. Boulangerie (bakery): croissant €1-2, sandwich €4-6. Tip: Don't eat at tourist trap restaurants!
```

### After Cleaning
```
I Need Food Nearby. Quick Bite. Boulangerie bakery: croissant 1 to 2 euros, sandwich 4 to 6 euros. Tip: Don't eat at tourist trap restaurants.
```

### Conversions
- `€10` → `10 euros`
- `$20` → `20 dollars`
- `5km` → `5 kilometers`
- `100m` → `100 meters`
- `5:30am` → `5 30 AM`
- `12:30pm` → `12 30 PM`

## Best Practices

1. **Keep summaries concise** - Max 150 characters per action
2. **Use natural pauses** - Between results
3. **Clean text** - Remove emojis, fix abbreviations
4. **Truncate long content** - First sentence or 150 chars
5. **Add context** - Time, location when relevant
6. **Include tips** - Brief "whatToDoInstead" when available

## Accessibility Features

- **Screen reader support**: All states announced
- **Keyboard navigation**: Full keyboard support
- **Visual indicators**: Clear state feedback
- **Focus management**: Proper focus handling
- **ARIA labels**: Descriptive labels for all states
