# Voice Search UX Copy

## Complete Copy Library

### State 1: Online

#### Primary Messages
```
Ready to listen
```

#### Secondary Messages
```
Speak your question or search term
```

```
Click the microphone to start
```

#### Button Labels
```
Voice
```

```
Listen
```

#### Tooltips
```
Click to start voice search
```

```
Voice search ready
```

#### Accessibility
```
Voice search ready. Click the microphone button to start.
```

---

### State 2: Poor Connection

#### Primary Messages
```
Using your downloaded pack
```

#### Secondary Messages
```
Voice search works perfectly offline
```

```
Your pack has everything you need
```

#### Button Labels
```
Voice
```

```
Voice (Offline)
```

#### Tooltips
```
Connection is slow, but your pack works great offline
```

```
Using your downloaded pack - works offline
```

#### Accessibility
```
Using your downloaded pack. Voice search works offline.
```

---

### State 3: Offline

#### Primary Messages
```
Voice search works offline
```

#### Secondary Messages
```
All results from your downloaded pack
```

```
No internet needed - your pack has everything
```

#### Button Labels
```
Voice
```

```
Voice (Offline)
```

#### Tooltips
```
No internet needed - your pack has everything
```

```
Voice search available offline
```

#### Accessibility
```
Voice search available offline. All results from your downloaded pack.
```

---

### State 4: Permission Denied

#### Primary Messages
```
Microphone access needed
```

#### Secondary Messages
```
Enable in your browser settings to use voice search
```

```
You can still search by typing - voice is optional
```

#### Helper Text
```
How to enable:
• Chrome/Edge: Click lock icon → Site settings → Microphone → Allow
• Firefox: Click lock icon → Permissions → Microphone → Allow
• Safari: Safari → Settings → Websites → Microphone → Allow
```

#### Button Labels
```
Voice (Permission Needed)
```

```
Enable Voice
```

#### Tooltips
```
Microphone permission needed - click to learn more
```

#### Accessibility
```
Microphone permission needed. Enable in browser settings to use voice search. You can still search by typing.
```

---

### State 5: No Matching Content

#### Primary Messages
```
No matching content found
```

#### Secondary Messages
```
Try different words or browse your pack
```

```
Examples: "late night food", "I'm lost", "toilet nearby"
```

#### Helper Text
```
Try:
• Simpler keywords
• Different phrases
• Browse pack categories
• Check quick search suggestions
```

#### Button Labels
```
Voice
```

#### Tooltips
```
No results found - try different words
```

#### Accessibility
```
No matching content found. Try different words or browse your pack.
```

---

## Message Tone Examples

### Confidence-Building Language

**Good Examples**:
- "Ready to listen" ✅
- "Works perfectly offline" ✅
- "Your pack has everything" ✅
- "Voice search works offline" ✅

**Bad Examples**:
- "Voice search available" ❌ (less confident)
- "Offline mode active" ❌ (technical)
- "Limited functionality" ❌ (negative)
- "Voice search unavailable" ❌ (error tone)

### Calm Messaging

**Good Examples**:
- "Using your downloaded pack" ✅
- "Try different words" ✅
- "Voice is optional" ✅
- "Works perfectly offline" ✅

**Bad Examples**:
- "Connection failed" ❌ (alarming)
- "Search error" ❌ (technical, negative)
- "Unable to connect" ❌ (failure language)
- "Network unavailable" ❌ (technical)

### Clear, Non-Technical Language

**Good Examples**:
- "Enable in your browser settings" ✅
- "Your downloaded pack" ✅
- "Click the microphone" ✅
- "Speak your question" ✅

**Bad Examples**:
- "API connection failed" ❌ (technical)
- "Network timeout" ❌ (technical)
- "Microphone API unavailable" ❌ (technical)
- "Speech recognition service error" ❌ (technical)

---

## Contextual Variations

### When User First Arrives

**Online**:
```
Welcome! Voice search is ready.
Click the microphone to start.
```

**Offline**:
```
Your pack is ready!
Voice search works offline.
```

### When User Returns

**Online**:
```
Ready to listen
```

**Offline**:
```
Voice search works offline
```

### When Connection Changes

**Online → Poor**:
```
Using your downloaded pack
```

**Poor → Offline**:
```
Voice search works offline
```

**Offline → Online**:
```
Ready to listen
```

---

## Error Recovery Messages

### Permission Denied Recovery

**Initial**:
```
Microphone access needed
```

**After User Tries Again**:
```
Still need permission
Enable in your browser settings
```

**Helpful**:
```
You can still search by typing
Voice is optional
```

### No Results Recovery

**Initial**:
```
No matching content found
```

**After User Tries Again**:
```
Still no matches
Try different words
```

**Helpful**:
```
Examples: "late night food", "I'm lost"
Or browse your pack categories
```

---

## Mobile-Specific Copy

### Shorter Messages (Mobile)

**Online**:
```
Ready
```

**Offline**:
```
Offline
```

**Permission Denied**:
```
Permission Needed
```

**No Results**:
```
No Results
```

### Touch-Friendly Instructions

**Online**:
```
Tap to start
```

**Offline**:
```
Tap to search
```

**Permission Denied**:
```
Tap to enable
```

---

## Voice-Specific Copy

### When Listening

**Active State**:
```
Listening...
```

**Processing**:
```
Understanding...
```

**Success**:
```
Found results
```

### When Speaking

**Instructions**:
```
Speak clearly
```

```
Say your search query
```

**Examples**:
```
Try: "late night food" or "I'm lost"
```

---

## Badge Text Options

### Short Badges

- "Online"
- "Offline"
- "Using Pack"
- "Permission"
- "No Results"

### Icon-Only Badges

- 🎤 (Online)
- 📦 (Offline)
- ⚡ (Poor Connection)
- 🔒 (Permission)
- 💡 (No Results)

### Status Dots

- Green dot (Online)
- Blue dot (Offline)
- Yellow dot (Poor Connection)
- Orange dot (Permission)
- Gray dot (No Results)

---

## Accessibility Copy

### Screen Reader Announcements

**Online**:
```
Voice search ready. Click the microphone button to start voice search.
```

**Poor Connection**:
```
Using your downloaded pack. Voice search works offline. No internet connection needed.
```

**Offline**:
```
Voice search available offline. All results from your downloaded pack. No internet connection needed.
```

**Permission Denied**:
```
Microphone permission needed. Enable microphone access in your browser settings to use voice search. You can still search by typing.
```

**No Matching Content**:
```
No matching content found for your search. Try using different words or browse through your pack categories.
```

### ARIA Labels

**Button (Online)**:
```
aria-label="Start voice search"
```

**Button (Offline)**:
```
aria-label="Start voice search offline"
```

**Button (Permission Denied)**:
```
aria-label="Voice search - microphone permission needed"
```

**Button (No Results)**:
```
aria-label="Start voice search again"
```

---

## Localization Considerations

### Language Variations

**English (US)**:
```
Ready to listen
```

**English (UK)**:
```
Ready to listen
```

**French**:
```
Prêt à écouter
```

**Spanish**:
```
Listo para escuchar
```

### Cultural Adaptations

- **Formal cultures**: More formal language
- **Casual cultures**: More friendly language
- **Technical cultures**: Can use slightly more technical terms
- **Non-technical cultures**: Very simple, non-technical language

---

## Testing Copy

### A/B Test Variations

**Version A** (Current):
```
Ready to listen
```

**Version B** (Alternative):
```
Voice search ready
```

**Version C** (Alternative):
```
Click to speak
```

### User Testing Questions

1. Does this message make you feel confident?
2. Is the language clear and easy to understand?
3. Do you know what to do next?
4. Does this feel calm and reassuring?
5. Is there any technical language you don't understand?
