# Voice Input UX Copy

## Permission States

### Initial Request
**When user first clicks voice button:**

```
🎤 Allow microphone access
To use voice search, we need permission to access your microphone.
Your voice is processed entirely on your device - no data is sent to servers.
[Allow] [Cancel]
```

### Permission Denied
**When user denies permission:**

```
🎤 Microphone permission needed

To use voice input, please enable microphone access in your browser settings.

How to enable:
• Chrome/Edge: Click the lock icon → Site settings → Microphone → Allow
• Firefox: Click the lock icon → Permissions → Microphone → Allow  
• Safari: Safari → Settings → Websites → Microphone → Allow

💡 You can still use text input - voice is optional!
```

### Not Supported
**When browser doesn't support speech recognition:**

```
ℹ️ Voice input not supported

Your browser doesn't support speech recognition. 
Please use the text input instead.
```

### Listening State
**While actively listening:**

```
🎤 Listening...
Speak your search query now.
```

### Processing State
**After speech detected, processing:**

```
🔄 Processing...
Converting your speech to text...
```

### Success State
**After successful transcription:**

```
✅ "late night food"
Searching...
```

### Error States

#### No Speech Detected
```
⚠️ No speech detected
Please try speaking again or use text input.
```

#### Audio Capture Error
```
⚠️ Microphone not accessible
Please check your microphone connection and try again.
```

#### Recognition Aborted
```
⚠️ Speech recognition was interrupted
Please try again.
```

#### General Error
```
⚠️ Voice input error
Something went wrong. Please try again or use text input.
```

## Button States

### Idle (Default)
- Icon: 🎤 Microphone icon
- Text: "Voice" (optional)
- Tooltip: "Click to start voice input"
- Style: White background, gray border

### Listening
- Icon: 🎤 Pulsing red microphone icon
- Text: "Listening..."
- Tooltip: "Click to stop listening"
- Style: Red background, red border, pulsing animation
- Indicator: Red dot in corner

### Requesting Permission
- Icon: 🎤 Microphone icon
- Text: "Requesting access..."
- Tooltip: "Requesting microphone permission..."
- Style: Yellow background, yellow border
- Disabled: Yes

### Permission Denied
- Icon: 🎤 Microphone icon with warning
- Text: "Permission needed"
- Tooltip: "Microphone permission denied. Click to try again."
- Style: Yellow background, yellow border
- Shows helper message below

### Error
- Icon: ⚠️ Warning icon
- Text: "Error"
- Tooltip: Error message
- Style: Yellow background, yellow border
- Shows error message below

## User Instructions

### First Time User
```
Try voice search! 🎤
Click the microphone button and speak your query.
Works entirely offline - no internet needed.
```

### After Permission Granted
```
Voice search ready! 🎤
Click the microphone button to start.
```

### Tips
```
💡 Tips for best results:
• Speak clearly and at a normal pace
• Reduce background noise
• Examples: "late night food", "I'm lost", "toilet nearby"
```

## Accessibility

### Screen Reader Announcements
- **Button pressed**: "Starting voice input"
- **Listening**: "Listening for speech"
- **Permission needed**: "Microphone permission required. Please enable in browser settings."
- **Error**: "Voice input error. Please try again or use text input."
- **Success**: "Voice input received: [transcript]"

### Keyboard Navigation
- Voice button is focusable
- Enter/Space activates voice input
- Escape cancels listening
- Tab order: Search input → Voice button → Results

## Error Recovery

### Permission Denied Recovery
```
🎤 Permission denied

[Try Again] - Opens permission dialog again
[Use Text Input] - Switches to text input
[Learn More] - Shows instructions
```

### No Speech Detected Recovery
```
⚠️ No speech detected

[Try Again] - Restarts listening
[Use Text Input] - Switches to text input
```

### General Error Recovery
```
⚠️ Something went wrong

[Try Again] - Retries voice input
[Use Text Input] - Switches to text input
[Report Issue] - Opens feedback form (optional)
```

## Success Feedback

### Immediate Feedback
```
✅ "late night food"
```

### Search Triggered
```
🔍 Searching for "late night food"...
```

### Results Found
```
Found 5 results for "late night food"
```

## Privacy Messaging

### Permission Request
```
🔒 Privacy First
Your voice is processed entirely on your device.
No audio is sent to servers.
No recordings are stored.
```

### After Permission
```
✅ Privacy Protected
Voice recognition runs locally on your device.
```

## Browser-Specific Instructions

### Chrome/Edge
```
1. Click the lock icon (🔒) in the address bar
2. Find "Microphone" in the list
3. Change from "Block" to "Allow"
4. Refresh the page
```

### Firefox
```
1. Click the lock icon (🔒) in the address bar
2. Click "Permissions"
3. Find "Microphone"
4. Change to "Allow"
5. Refresh the page
```

### Safari
```
1. Open Safari menu → Settings
2. Go to "Websites" tab
3. Select "Microphone" in left sidebar
4. Find this website
5. Change to "Allow"
6. Refresh the page
```

### Mobile (iOS Safari)
```
1. Open iOS Settings
2. Go to Safari → Microphone
3. Enable microphone access
4. Return to Safari and allow when prompted
```

### Mobile (Android Chrome)
```
1. Tap the three dots menu
2. Go to Settings → Site settings
3. Tap Microphone
4. Allow for this site
5. Refresh the page
```

## Fallback Messaging

### When Voice Unavailable
```
Voice input is not available, but you can still search using text!
Type your query in the search box above.
```

### When Offline (if relevant)
```
Voice input works offline! 🎤
No internet connection needed.
```

## Microcopy

### Button Labels
- **Default**: "Voice" or just icon
- **Listening**: "Listening..."
- **Processing**: "Processing..."
- **Error**: "Try Again"

### Placeholder Text
- Search input: "Search: toilet, ATM, pharmacy, metro, food..."
- With voice hint: "Type or speak your query..."

### Helper Text
- "Click microphone to search by voice"
- "Voice search works offline"
- "Speak clearly for best results"
