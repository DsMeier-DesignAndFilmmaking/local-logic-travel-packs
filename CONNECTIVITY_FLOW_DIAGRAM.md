# Connectivity Check Flow Diagram

## Visual Timing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTION: Search Query                    │
│                    (Voice or Text Input)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │  STEP 1: Execute Offline Search           │
        │  ⚡ IMMEDIATE (<50ms)                      │
        │  ┌────────────────────────────────────┐  │
        │  │ • Search local data                 │  │
        │  │ • No network calls                  │  │
        │  │ • Returns results instantly         │  │
        │  └────────────────────────────────────┘  │
        └────────────────────┬──────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Results Shown  │ ✅ USER SEES RESULTS
                    │  to User        │    (No waiting!)
                    └─────────────────┘
                             │
                             │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────────────┐
│  STEP 2: Connectivity │              │  STEP 3: Online Enhancement  │
│  Check (PARALLEL)    │              │  (ASYNC, NON-BLOCKING)      │
│  ⚡ NON-BLOCKING      │              │  ⚡ NON-BLOCKING             │
│                       │              │                             │
│  t=0ms:               │              │  Waits for connectivity     │
│  navigator.onLine     │              │  check to complete          │
│  → 'online' (guess)   │              │                             │
│                       │              │  If online/poor:            │
│  t=10ms:              │              │  • Fetch additional data    │
│  fetch() starts       │              │  • Enhance results          │
│                       │              │  • Update UI asynchronously │
│  t=100-1000ms:        │              │                             │
│  fetch() completes    │              │  If offline:                │
│  → Refined state      │              │  • Skip enhancement         │
│                       │              │  • Keep offline results     │
└───────────────────────┘              └──────────────────────────────┘
```

## State Machine

```
                    ┌─────────────┐
                    │   IDLE      │
                    └──────┬──────┘
                           │
                           │ User submits query
                           ▼
        ┌──────────────────────────────────┐
        │  OFFLINE SEARCH (IMMEDIATE)      │
        │  ┌────────────────────────────┐ │
        │  │ • Execute search           │ │
        │  │ • Return results           │ │
        │  │ • Time: <50ms              │ │
        │  └────────────────────────────┘ │
        └──────────────┬───────────────────┘
                       │
                       │ Results shown to user
                       ▼
        ┌──────────────────────────────────┐
        │  CONNECTIVITY CHECK (PARALLEL)  │
        │  ┌────────────────────────────┐ │
        │  │ navigator.onLine → state   │ │
        │  │ fetch() → refined state    │ │
        │  │ Time: 0-1000ms             │ │
        │  └────────────────────────────┘ │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────┐            ┌──────────────┐
│   ONLINE     │            │   OFFLINE    │
│              │            │              │
│ • Enhance   │            │ • Keep       │
│   results   │            │   offline    │
│ • Fetch     │            │   results    │
│   data      │            │ • No         │
│ • Update    │            │   enhancement│
│   UI        │            │              │
└──────────────┘            └──────────────┘
```

## Timeline Visualization

### Fast Connection Scenario

```
Time (ms) │
──────────┼─────────────────────────────────────────────────────────
    0     │ Query submitted
          │ ├─ Offline search starts
          │ └─ Connectivity check starts (parallel)
    10    │ │ └─ navigator.onLine check → 'online'
    50    │ ├─ Offline search completes
          │ └─ ✅ Results shown to user
    100   │ └─ fetch() completes → 'online' (confirmed)
    100   │ └─ Enhancement starts
    200   │ └─ Enhanced results available
          │
```

### Slow Connection Scenario

```
Time (ms) │
──────────┼─────────────────────────────────────────────────────────
    0     │ Query submitted
          │ ├─ Offline search starts
          │ └─ Connectivity check starts (parallel)
    10    │ │ └─ navigator.onLine check → 'online'
    50    │ ├─ Offline search completes
          │ └─ ✅ Results shown to user
    600   │ └─ fetch() completes → 'poor' (slow)
    600   │ └─ Enhancement starts (if enabled for 'poor')
    1200  │ └─ Enhanced results available
          │
```

### Offline Scenario

```
Time (ms) │
──────────┼─────────────────────────────────────────────────────────
    0     │ Query submitted
          │ ├─ Offline search starts
          │ └─ Connectivity check starts (parallel)
    10    │ │ └─ navigator.onLine check → 'offline'
    50    │ ├─ Offline search completes
          │ └─ ✅ Results shown to user
    1000  │ └─ fetch() timeout → 'offline' (confirmed)
          │ └─ No enhancement (offline)
          │
```

## Parallel Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN THREAD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  t=0ms:  User submits query                                     │
│          │                                                       │
│          ├─► Offline Search (synchronous, fast)                │
│          │   └─► Returns results in <50ms                      │
│          │                                                       │
│          └─► Connectivity Check (async, non-blocking)          │
│              │                                                   │
│              ├─► Immediate: navigator.onLine (0ms)              │
│              │   └─► Returns: 'online' or 'offline'             │
│              │                                                   │
│              └─► Refined: fetch() (0-1000ms)                    │
│                  └─► Returns: 'online' | 'poor' | 'offline'    │
│                                                                  │
│  t=50ms: Results displayed ✅                                    │
│                                                                  │
│  t=100ms: Connectivity state updated (if changed)                │
│                                                                  │
│  t=100ms: Enhancement starts (if online)                        │
│          └─► Runs in background                                │
│              └─► Updates results when complete                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Timing Points

| Event | Time | Blocking | User Impact |
|-------|------|---------|-------------|
| Offline search | 0-50ms | No | Results appear instantly |
| navigator.onLine | 0ms | No | Initial state guess |
| fetch() check | 10-1000ms | No | State refined in background |
| Results display | 50ms | No | User sees results |
| Enhancement | 100ms+ | No | Results may improve |

## Non-Blocking Guarantees

✅ **Search never waits** for connectivity check  
✅ **Results always shown** immediately  
✅ **Connectivity check** runs in parallel  
✅ **Enhancement** happens asynchronously  
✅ **No blocking operations** in main thread  

## Example Code Flow

```typescript
// Step 1: Immediate search (non-blocking)
const immediateResults = searchOffline(query); // <50ms
// ✅ Results shown to user

// Step 2: Connectivity check (parallel, non-blocking)
const { immediateState, promise } = checkConnectivityNonBlocking();
// immediateState: 'online' or 'offline' (0ms)
// promise: Refined state (0-1000ms, doesn't block)

// Step 3: Enhancement (async, non-blocking)
promise.then(connectivityState => {
  if (connectivityState !== 'offline') {
    enhanceResults(immediateResults); // Background
  }
});
```

## Performance Metrics

- **Time to first result**: <50ms (offline search)
- **Connectivity check**: 0-1000ms (non-blocking)
- **Enhancement time**: Variable (non-blocking)
- **User-perceived latency**: <50ms (instant results)
- **Total blocking time**: 0ms (all async)
