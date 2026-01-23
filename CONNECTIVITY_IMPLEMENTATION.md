# Connectivity Check Implementation

## Overview

Fast, non-blocking connectivity check that runs in parallel with search operations. Never blocks search results and provides connectivity state for optional online enhancements.

## Core Principles

✅ **Never blocks search** - Offline search executes immediately  
✅ **Non-blocking** - Connectivity check runs in parallel  
✅ **Fast timeout** - 1000ms max wait  
✅ **Progressive enhancement** - Results improve asynchronously if online  
✅ **Graceful degradation** - Works perfectly offline  

## Architecture

### Components

1. **`connectivity.ts`** - Core connectivity utilities
   - `checkConnectivity()` - Synchronous check with timeout
   - `checkConnectivityNonBlocking()` - Non-blocking check
   - `ConnectivityMonitor` - Continuous monitoring
   - State enum: `'online' | 'poor' | 'offline'`

2. **`useConnectivity.ts`** - React hook
   - Reactive connectivity state
   - Automatic monitoring
   - State change callbacks

3. **`enhancedSearch.ts`** - Search with enhancement
   - Immediate offline search
   - Parallel connectivity check
   - Async online enhancement

## Connectivity States

### `'online'`
- **Condition**: Fast connection (<500ms latency)
- **Behavior**: Full online enhancement available
- **Detection**: fetch() completes quickly

### `'poor'`
- **Condition**: Slow/unstable connection (500-1000ms latency)
- **Behavior**: Limited enhancement, may timeout
- **Detection**: fetch() slow or timeout

### `'offline'`
- **Condition**: No connection
- **Behavior**: No enhancement, offline-only
- **Detection**: navigator.onLine === false or fetch() fails

## Usage

### Basic Check

```typescript
import { checkConnectivity } from '@/lib/connectivity';

const state = await checkConnectivity({ timeout: 1000 });
console.log(state); // 'online' | 'poor' | 'offline'
```

### Non-Blocking Check

```typescript
import { checkConnectivityNonBlocking } from '@/lib/connectivity';

const { immediateState, promise } = checkConnectivityNonBlocking();

// Immediate state (0ms)
console.log(immediateState); // 'online' | 'offline'

// Refined state (0-1000ms, non-blocking)
promise.then((refinedState) => {
  console.log(refinedState); // 'online' | 'poor' | 'offline'
});
```

### With Search

```typescript
import { searchWithEnhancement } from '@/lib/enhancedSearch';

// Get immediate results (non-blocking)
const { immediateResults, enhancementPromise } = await searchWithEnhancement(
  'Paris',
  'late night food',
  {
    enableOnlineEnhancement: true,
    onEnhancementComplete: (enhanced) => {
      console.log('Enhanced:', enhanced);
    },
  }
);

// Results shown immediately
console.log(immediateResults);

// Enhancement happens in background
const enhanced = await enhancementPromise;
```

### React Hook

```typescript
import { useConnectivity } from '@/lib/useConnectivity';

function MyComponent() {
  const { state, isOnline, isOffline, check } = useConnectivity({
    checkOnMount: true,
    monitorInterval: 30000,
  });

  return (
    <div>
      <p>Connection: {state}</p>
      {isOffline && <p>Working offline</p>}
    </div>
  );
}
```

### Connectivity Monitor

```typescript
import { getConnectivityMonitor } from '@/lib/connectivity';

const monitor = getConnectivityMonitor({
  onStateChange: (state) => {
    console.log('State changed:', state);
  },
});

// Subscribe to changes
const unsubscribe = monitor.subscribe((state) => {
  console.log('New state:', state);
});

// Start periodic monitoring
monitor.startMonitoring(30000); // Every 30 seconds

// Manual check
await monitor.check();

// Cleanup
monitor.dispose();
```

## Timing Flow

### Immediate Response (<50ms)

```
t=0ms:   Query submitted
t=0ms:   Offline search starts
t=0ms:   Connectivity check starts (parallel)
t=50ms:  Offline search completes
t=50ms:  Results displayed ✅
```

### Connectivity Check (0-1000ms)

```
t=0ms:    navigator.onLine check → immediate state
t=10ms:   fetch() request starts
t=100ms:  Response (fast) → 'online'
t=600ms:  Response (slow) → 'poor'
t=1000ms: Timeout → 'poor' or 'offline'
```

### Enhancement (Variable, Non-Blocking)

```
t=100ms:  Connectivity confirmed: 'online'
t=100ms:  Enhancement starts (background)
t=500ms:  Enhanced results available
```

## Performance

- **Offline search**: <50ms (non-blocking)
- **Immediate state**: 0ms (navigator.onLine)
- **Refined check**: 0-1000ms (non-blocking)
- **Enhancement**: Variable (non-blocking)
- **Total blocking time**: 0ms

## Error Handling

### Network Errors
- **Timeout**: Returns 'poor' or 'offline'
- **Fetch error**: Returns 'offline'
- **CORS error**: Returns 'poor' (no-cors mode)

### Graceful Degradation
- **Offline**: Works perfectly, no enhancement
- **Poor connection**: Limited enhancement, may skip
- **Online**: Full enhancement available

## Integration Points

### With Voice Input
```typescript
// Voice transcription completes
const transcript = 'late night food';

// Search immediately (non-blocking)
const results = searchImmediate('Paris', transcript);

// Connectivity check in parallel (non-blocking)
const { promise } = checkConnectivityNonBlocking();
promise.then(state => {
  if (state !== 'offline') {
    // Enhance results
  }
});
```

### With Text Search
```typescript
// User types query
const query = 'toilet';

// Search immediately
const results = searchImmediate('Paris', query);

// Enhancement in background
// (handled automatically by searchImmediate)
```

## State Transitions

```
Initial: navigator.onLine
  ├─ true → 'online' (immediate)
  │         └─ fetch() → 'online' | 'poor' | 'offline'
  │
  └─ false → 'offline' (immediate)
            └─ fetch() → 'offline' (confirmed)
```

## Browser Events

### Online Event
```typescript
window.addEventListener('online', () => {
  // Connection restored
  monitor.check(); // Re-check connectivity
});
```

### Offline Event
```typescript
window.addEventListener('offline', () => {
  // Connection lost
  // State immediately becomes 'offline'
});
```

## Files

- `src/lib/connectivity.ts` - Core connectivity utilities
- `src/lib/useConnectivity.ts` - React hook
- `src/lib/enhancedSearch.ts` - Search with enhancement
- `src/lib/connectivityExample.ts` - Usage examples
- `CONNECTIVITY_TIMING_FLOW.md` - Timing documentation
- `CONNECTIVITY_FLOW_DIAGRAM.md` - Visual flow diagrams
- `CONNECTIVITY_IMPLEMENTATION.md` - This file

## Testing

### Manual Testing
1. Test with good connection (should detect 'online')
2. Test with slow connection (should detect 'poor')
3. Test offline (should detect 'offline')
4. Test with connection changes (online/offline events)
5. Verify non-blocking behavior (search never waits)

### Test Cases
- ✅ Connectivity check doesn't block search
- ✅ Immediate state from navigator.onLine
- ✅ Refined state from fetch()
- ✅ Timeout handling (1000ms max)
- ✅ Online/offline event handling
- ✅ State transitions work correctly
- ✅ Enhancement only when online
- ✅ Graceful degradation when offline

## Future Enhancements

- [ ] Multiple connectivity endpoints
- [ ] Connection quality metrics (bandwidth, latency)
- [ ] Retry logic with exponential backoff
- [ ] Cached connectivity state
- [ ] Service worker integration
- [ ] Network information API integration
