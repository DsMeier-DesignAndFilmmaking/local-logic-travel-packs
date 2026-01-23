# Connectivity Check Timing Flow

## Overview

The connectivity check is designed to be **fast and non-blocking**. It runs in parallel with search operations and never delays search results.

## Timing Flow Diagram

```
User Action: Voice Input or Text Search
│
├─┐
│ │ Step 1: Execute Offline Search (IMMEDIATE)
│ │ Time: <50ms
│ │ Result: Search results returned immediately
│ └─→ [User sees results]
│
├─┐
│ │ Step 2: Check Connectivity (PARALLEL, NON-BLOCKING)
│ │ Time: <1000ms (with timeout)
│ │ 
│ │ ┌─ Immediate State (0ms)
│ │ │  navigator.onLine → 'online' or 'offline'
│ │ │  Returns: Best guess state
│ │ └─→ [Used for initial UI state]
│ │
│ │ ┌─ Refined Check (async, 0-1000ms)
│ │ │  fetch() with timeout
│ │ │  Returns: 'online' | 'poor' | 'offline'
│ │ └─→ [Updates UI state if changed]
│ └─→ [Enhancement triggered if online]
│
└─┐
  │ Step 3: Online Enhancement (ASYNC, NON-BLOCKING)
  │ Time: Variable (doesn't block)
  │ Condition: Only if connectivity = 'online' or 'poor'
  │ 
  │ ┌─ Fetch additional data (if online)
  │ │  API calls, data enrichment
  │ │  Time: Variable (background)
  │ └─→ [Results enhanced asynchronously]
  │
  └─→ [UI updates with enhanced results]
```

## Detailed Timing Breakdown

### Phase 1: Immediate Response (<50ms)

```
t=0ms:   User submits query
t=0ms:   Offline search starts
t=10ms:  Connectivity check starts (parallel)
t=50ms:  Offline search completes
t=50ms:  Results displayed to user ✅
```

**User Experience**: Results appear instantly, no waiting.

### Phase 2: Connectivity Check (0-1000ms)

```
t=0ms:    navigator.onLine check (instant)
t=0ms:    Immediate state: 'online' or 'offline'
t=10ms:   fetch() request starts
t=100ms:  Response received (fast connection)
          → State: 'online'
t=500ms:  Response received (slow connection)
          → State: 'poor'
t=1000ms: Timeout (no response)
          → State: 'poor' or 'offline'
```

**User Experience**: Connectivity state updates in background, doesn't block UI.

### Phase 3: Online Enhancement (Variable, Non-Blocking)

```
t=100ms:  Connectivity confirmed: 'online'
t=100ms:  Enhancement starts (background)
t=200ms:  API call initiated
t=500ms:  Enhanced data received
t=500ms:  Results updated with enhancements
```

**User Experience**: Results may improve, but initial results already shown.

## State Transitions

```
Initial State (navigator.onLine)
│
├─→ 'online' (if navigator.onLine === true)
│   └─→ Refined to 'online' (if fetch < 500ms)
│   └─→ Refined to 'poor' (if fetch 500-1000ms)
│   └─→ Refined to 'offline' (if fetch timeout)
│
└─→ 'offline' (if navigator.onLine === false)
    └─→ Confirmed 'offline' (if fetch fails)
```

## Example Scenarios

### Scenario 1: Fast Connection

```
t=0ms:    Query submitted
t=0ms:    navigator.onLine = true → 'online' (immediate)
t=10ms:   fetch() starts
t=50ms:   Offline search completes → Results shown
t=100ms:  fetch() completes (90ms latency)
          → State: 'online' (confirmed)
t=100ms:  Enhancement starts
t=200ms:  Enhanced results available
```

**Total time to results**: 50ms  
**Enhancement time**: 200ms (non-blocking)

### Scenario 2: Slow Connection

```
t=0ms:    Query submitted
t=0ms:    navigator.onLine = true → 'online' (immediate)
t=10ms:   fetch() starts
t=50ms:   Offline search completes → Results shown
t=600ms:  fetch() completes (590ms latency)
          → State: 'poor' (slow connection)
t=600ms:  Enhancement starts (if enabled for 'poor')
t=1200ms: Enhanced results available
```

**Total time to results**: 50ms  
**Enhancement time**: 1200ms (non-blocking)

### Scenario 3: Offline

```
t=0ms:    Query submitted
t=0ms:    navigator.onLine = false → 'offline' (immediate)
t=10ms:   fetch() starts (will fail)
t=50ms:   Offline search completes → Results shown
t=1000ms: fetch() timeout
          → State: 'offline' (confirmed)
t=1000ms: No enhancement (offline)
```

**Total time to results**: 50ms  
**Enhancement**: None (offline)

### Scenario 4: Connection Drops During Search

```
t=0ms:    Query submitted
t=0ms:    navigator.onLine = true → 'online' (immediate)
t=10ms:   fetch() starts
t=50ms:   Offline search completes → Results shown
t=200ms:  Connection drops
t=1000ms: fetch() timeout
          → State: 'poor' or 'offline'
t=1000ms: Enhancement cancelled or fails gracefully
```

**Total time to results**: 50ms  
**Enhancement**: Cancelled (connection lost)

## Performance Characteristics

### Offline Search
- **Time**: <50ms (typically 10-30ms)
- **Blocking**: No (runs in main thread but fast)
- **Dependency**: None (local data only)

### Connectivity Check
- **Immediate state**: 0ms (navigator.onLine)
- **Refined check**: 0-1000ms (with timeout)
- **Blocking**: No (async, non-blocking)
- **Dependency**: Network (but doesn't block search)

### Online Enhancement
- **Time**: Variable (100ms - 5000ms+)
- **Blocking**: No (async, background)
- **Dependency**: Network + API availability

## Key Design Principles

1. **Never Block Search**: Offline search always executes immediately
2. **Parallel Execution**: Connectivity check runs in parallel with search
3. **Progressive Enhancement**: Results improve asynchronously if online
4. **Graceful Degradation**: Works perfectly offline, better online
5. **Fast Timeout**: 1000ms max wait for connectivity check
6. **Immediate Feedback**: navigator.onLine provides instant state

## Implementation Notes

### Non-Blocking Pattern

```typescript
// Step 1: Immediate results (non-blocking)
const immediateResults = searchOffline(query);

// Step 2: Connectivity check (parallel, non-blocking)
const { immediateState, promise } = checkConnectivityNonBlocking();

// Step 3: Enhancement (async, non-blocking)
const enhancedResults = await enhanceResults(immediateResults, connectivityState);
```

### Timeout Strategy

- **Short timeout (1000ms)**: Fast failure, doesn't delay
- **Fallback to offline**: If timeout, assume offline/poor
- **Retry logic**: Optional, but doesn't block initial results

### State Management

- **Immediate state**: From navigator.onLine (0ms)
- **Refined state**: From fetch() check (0-1000ms)
- **State updates**: Trigger UI updates asynchronously
- **No blocking**: State changes don't delay search results

## User Experience Impact

### Perceived Performance
- **Search results**: Appear instantly (<50ms)
- **Connectivity indicator**: Updates in background
- **Enhanced results**: Improve asynchronously (if online)

### Offline Experience
- **No degradation**: Works perfectly offline
- **No delays**: No waiting for network checks
- **No errors**: Graceful handling of offline state

### Online Experience
- **Immediate results**: Same fast experience
- **Progressive enhancement**: Results may improve
- **Better experience**: Enhanced data when available
