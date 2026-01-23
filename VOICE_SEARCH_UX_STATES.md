# Voice Search UX States

## State Definitions

### State Table

| State | Icon | Badge | Tone | Message Type | User Action |
|-------|------|-------|------|--------------|-------------|
| **Online** | 🎤 | Green | Positive | "Ready to listen" | Click to start |
| **Poor Connection** | ⚡ | Yellow | Reassuring | "Using your pack" | Continue using |
| **Offline** | 📦 | Blue | Confident | "Works offline" | Continue using |
| **Permission Denied** | 🔒 | Orange | Helpful | "Need permission" | Enable in settings |
| **No Matching Content** | 💡 | Gray | Helpful | "Try different words" | Modify query |

---

## State 1: Online

### Visual Design

**Icon**: 🎤 Microphone (active, pulsing when listening)
**Badge**: Green dot or "Online" badge
**Color**: Green (#10B981)

### Copy

**Primary Message**:
```
Ready to listen
```

**Secondary Message** (optional):
```
Speak your question or search term
```

**Tooltip/Hover**:
```
Click to start voice search
```

**Button Label**:
```
Voice
```

**Accessibility Announcement**:
```
Voice search ready. Click the microphone button to start.
```

### Behavior

- **Default state** when online and ready
- **Transitions to**: Speaking (when activated)
- **User can**: Click to start voice input

### Confidence-Building Elements

- ✅ "Ready" implies capability
- ✅ Simple, clear instruction
- ✅ No technical jargon
- ✅ Positive framing

---

## State 2: Poor Connection

### Visual Design

**Icon**: ⚡ Lightning bolt (dimmed) or 📦 Pack icon
**Badge**: Yellow dot or "Using Pack" badge
**Color**: Yellow/Amber (#F59E0B)

### Copy

**Primary Message**:
```
Using your downloaded pack
```

**Secondary Message**:
```
Voice search works perfectly offline
```

**Tooltip/Hover**:
```
Connection is slow, but your pack works great offline
```

**Button Label**:
```
Voice (Offline)
```

**Accessibility Announcement**:
```
Using your downloaded pack. Voice search works offline.
```

### Behavior

- **Shown when**: Connection is slow/unstable
- **Transitions to**: Online (if connection improves)
- **User can**: Continue using voice search normally

### Confidence-Building Elements

- ✅ "Works perfectly" reassures capability
- ✅ "Your pack" emphasizes ownership/control
- ✅ No mention of "slow" or "poor"
- ✅ Focuses on what works, not what doesn't

---

## State 3: Offline

### Visual Design

**Icon**: 📦 Pack icon or 🎤 Microphone (with offline indicator)
**Badge**: Blue dot or "Offline" badge
**Color**: Blue (#3B82F6)

### Copy

**Primary Message**:
```
Voice search works offline
```

**Secondary Message**:
```
All results from your downloaded pack
```

**Tooltip/Hover**:
```
No internet needed - your pack has everything
```

**Button Label**:
```
Voice
```

**Accessibility Announcement**:
```
Voice search available offline. All results from your downloaded pack.
```

### Behavior

- **Shown when**: No internet connection
- **Transitions to**: Online (if connection restored)
- **User can**: Use voice search normally

### Confidence-Building Elements

- ✅ "Works offline" is positive, not limiting
- ✅ "Your downloaded pack" emphasizes control
- ✅ No "unavailable" or "limited" language
- ✅ Confident tone about capability

---

## State 4: Permission Denied

### Visual Design

**Icon**: 🔒 Lock icon or 🎤 Microphone (with lock overlay)
**Badge**: Orange dot or "Permission Needed" badge
**Color**: Orange (#F97316)

### Copy

**Primary Message**:
```
Microphone access needed
```

**Secondary Message**:
```
Enable in your browser settings to use voice search
```

**Helper Text**:
```
You can still search by typing - voice is optional
```

**Button Label**:
```
Voice (Permission Needed)
```

**Accessibility Announcement**:
```
Microphone permission needed. Enable in browser settings to use voice search. You can still search by typing.
```

### Behavior

- **Shown when**: Microphone permission denied
- **Transitions to**: Online (if permission granted)
- **User can**: Enable permission or use text search

### Confidence-Building Elements

- ✅ "Needed" not "denied" or "failed"
- ✅ Clear, simple instruction
- ✅ Reassures text search still works
- ✅ "Optional" reduces pressure

---

## State 5: No Matching Content

### Visual Design

**Icon**: 💡 Lightbulb or 🔍 Search (with question mark)
**Badge**: Gray dot or "No Results" badge
**Color**: Gray (#6B7280)

### Copy

**Primary Message**:
```
No matching content found
```

**Secondary Message**:
```
Try different words or browse your pack
```

**Helper Text**:
```
Examples: "late night food", "I'm lost", "toilet nearby"
```

**Button Label**:
```
Voice
```

**Accessibility Announcement**:
```
No matching content found. Try different words or browse your pack.
```

### Behavior

- **Shown when**: Search returns no results
- **Transitions to**: Any state (when new query entered)
- **User can**: Try different query or browse pack

### Confidence-Building Elements

- ✅ "No matching content" not "no results" or "failed"
- ✅ Helpful suggestions, not just error
- ✅ Examples guide user
- ✅ "Browse your pack" offers alternative

---

## Icon Usage Recommendations

### Primary Icons

| State | Icon | Usage | Size |
|-------|------|-------|------|
| Online | 🎤 | Main button icon | 24px |
| Poor Connection | ⚡ | Badge/indicator | 16px |
| Offline | 📦 | Badge/indicator | 16px |
| Permission Denied | 🔒 | Button overlay | 20px |
| No Matching Content | 💡 | Empty state | 48px |

### Icon States

**Microphone Icon**:
- **Default**: Outline style, gray
- **Active**: Filled style, green, pulsing animation
- **Listening**: Filled style, red, pulsing animation
- **Disabled**: Outline style, gray, 50% opacity

**Badge Icons**:
- **Online**: Green dot (8px)
- **Poor Connection**: Yellow dot (8px)
- **Offline**: Blue dot (8px)
- **Permission Denied**: Orange dot (8px)

### Animation Guidelines

- **Pulsing**: 2s cycle, ease-in-out
- **Fade**: 300ms transition
- **Scale**: 1.0 → 1.1 → 1.0 (subtle)

---

## Badge Usage Recommendations

### Badge Types

1. **Status Badge** (top-right corner)
   - Small dot (8px)
   - Color-coded by state
   - Pulsing when active

2. **Text Badge** (below button)
   - Small text (12px)
   - Color-coded background
   - Rounded corners (4px)

3. **Inline Badge** (in button)
   - Small icon + text
   - Subtle background
   - Doesn't interfere with button

### Badge Placement

- **Status dot**: Top-right of button
- **Text badge**: Below button or inline
- **Icon badge**: Next to button text

---

## Message Tone Guidelines

### Do ✅

- Use positive, confident language
- Focus on what works, not what doesn't
- Provide helpful alternatives
- Keep messages short and clear
- Use "your pack" to emphasize ownership

### Don't ❌

- Use technical terms ("API", "network", "connection")
- Use error language ("failed", "error", "unavailable")
- Create urgency or pressure
- Blame the user
- Use negative framing

### Examples

**Good**:
- "Using your downloaded pack"
- "Voice search works offline"
- "Try different words"

**Bad**:
- "Network connection failed"
- "Voice search unavailable"
- "No results found - try again"

---

## State Transitions

### Flow Diagram

```
[Online] ←→ [Poor Connection] ←→ [Offline]
    ↓
[Speaking]
    ↓
[Results Found] → [No Matching Content]
    ↓
[Permission Denied] (if permission needed)
```

### Transition Messages

**Online → Poor Connection**:
```
Using your downloaded pack
```

**Poor Connection → Offline**:
```
Voice search works offline
```

**Offline → Online**:
```
Ready to listen
```

**Permission Denied → Online**:
```
Voice search ready
```

---

## Accessibility Considerations

### Screen Reader Announcements

- **Online**: "Voice search ready. Click to start."
- **Poor Connection**: "Using your downloaded pack. Voice search works offline."
- **Offline**: "Voice search available offline. All results from your downloaded pack."
- **Permission Denied**: "Microphone permission needed. Enable in browser settings."
- **No Matching Content**: "No matching content found. Try different words."

### Keyboard Navigation

- All states: Button is focusable
- Tab order: Logical flow
- Enter/Space: Activates appropriate action
- Escape: Cancels current state

### Visual Indicators

- Color coding: Consistent across states
- Icons: Clear and recognizable
- Text: High contrast (WCAG AA)
- Focus: Clear focus indicators

---

## Implementation Examples

### React Component State

```typescript
type VoiceSearchState = 
  | 'online'
  | 'poor_connection'
  | 'offline'
  | 'permission_denied'
  | 'no_matching_content';

const stateMessages = {
  online: {
    primary: 'Ready to listen',
    secondary: 'Speak your question or search term',
    icon: '🎤',
    badge: 'green',
  },
  poor_connection: {
    primary: 'Using your downloaded pack',
    secondary: 'Voice search works perfectly offline',
    icon: '⚡',
    badge: 'yellow',
  },
  offline: {
    primary: 'Voice search works offline',
    secondary: 'All results from your downloaded pack',
    icon: '📦',
    badge: 'blue',
  },
  permission_denied: {
    primary: 'Microphone access needed',
    secondary: 'Enable in your browser settings to use voice search',
    icon: '🔒',
    badge: 'orange',
  },
  no_matching_content: {
    primary: 'No matching content found',
    secondary: 'Try different words or browse your pack',
    icon: '💡',
    badge: 'gray',
  },
};
```

---

## Copy Variations

### Short Form (for small spaces)

- Online: "Ready"
- Poor Connection: "Using Pack"
- Offline: "Offline"
- Permission Denied: "Permission Needed"
- No Matching Content: "No Results"

### Long Form (for detailed explanations)

- Online: "Voice search is ready. Click the microphone to start speaking your search query."
- Poor Connection: "Your connection is slow, but don't worry - your downloaded pack works perfectly offline. Voice search is fully available."
- Offline: "You're offline, but that's okay! Your downloaded pack has everything you need. Voice search works completely offline."
- Permission Denied: "To use voice search, we need permission to access your microphone. You can enable this in your browser settings. In the meantime, you can still search by typing."
- No Matching Content: "We couldn't find any matching content for your search. Try using different words, or browse through your pack categories to find what you need."

---

## Testing Checklist

- [ ] All states display correct copy
- [ ] Icons are clear and recognizable
- [ ] Badges are color-coded correctly
- [ ] Messages are calm and confidence-building
- [ ] No technical language used
- [ ] Accessibility announcements work
- [ ] State transitions are smooth
- [ ] Keyboard navigation works
- [ ] Visual indicators are clear
- [ ] Mobile responsive
