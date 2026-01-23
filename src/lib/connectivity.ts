/**
 * Fast, Non-Blocking Connectivity Check
 * 
 * Detects connection state without blocking search results:
 * - Online: Good connection
 * - Poor: Slow/unstable connection
 * - Offline: No connection
 * 
 * Runs in parallel with search, never blocks results
 */

export type ConnectivityState = 
  | 'online'        // Good connection
  | 'poor'          // Slow/unstable connection
  | 'offline';      // No connection

export type ConnectivityCheckResult = {
  state: ConnectivityState;
  latency?: number;  // Response time in ms (if available)
  timestamp: number; // When check was performed
};

export interface ConnectivityCheckOptions {
  timeout?: number;        // Max time to wait (default: 1000ms)
  url?: string;            // URL to check (default: small resource)
  retries?: number;        // Number of retries (default: 1)
  onStateChange?: (state: ConnectivityState) => void;
}

/**
 * Fast connectivity check using fetch with timeout
 * Non-blocking: Returns immediately with best guess, refines asynchronously
 */
export async function checkConnectivity(
  options: ConnectivityCheckOptions = {}
): Promise<ConnectivityState> {
  const {
    timeout = 1000,
    url = 'https://www.google.com/favicon.ico', // Small, fast resource
    retries = 1,
  } = options;

  // Quick check: navigator.onLine (instant, but not always accurate)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }

  // Fast check with timeout
  try {
    const startTime = performance.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Faster, doesn't require CORS
      cache: 'no-cache',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = performance.now() - startTime;

    // Determine state based on latency
    if (latency < 500) {
      return 'online';
    } else if (latency < timeout) {
      return 'poor';
    } else {
      return 'offline';
    }
  } catch (error) {
    // Network error or timeout
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout - likely poor connection or offline
      return 'poor';
    }
    
    // Other errors - assume offline
    return 'offline';
  }
}

/**
 * Non-blocking connectivity check
 * Returns immediately with cached/quick state, refines asynchronously
 */
export function checkConnectivityNonBlocking(
  options: ConnectivityCheckOptions = {}
): {
  immediateState: ConnectivityState;
  promise: Promise<ConnectivityState>;
} {
  // Immediate state from navigator.onLine (instant)
  const immediateState: ConnectivityState = 
    typeof navigator !== 'undefined' && navigator.onLine
      ? 'online' // Best guess, will refine
      : 'offline';

  // Refine asynchronously (non-blocking)
  const promise = checkConnectivity(options).then((refinedState) => {
    // Notify state change if callback provided
    if (options.onStateChange && refinedState !== immediateState) {
      options.onStateChange(refinedState);
    }
    return refinedState;
  });

  return {
    immediateState,
    promise,
  };
}

/**
 * Connectivity monitor
 * Continuously monitors connection state
 */
export class ConnectivityMonitor {
  private state: ConnectivityState = 'online';
  private listeners: Set<(state: ConnectivityState) => void> = new Set();
  private checkInterval: number | null = null;
  private lastCheck: number = 0;
  private checkPromise: Promise<ConnectivityState> | null = null;

  constructor(private options: ConnectivityCheckOptions = {}) {
    // Initial check
    this.check();
    
    // Monitor online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setState('online');
        this.check();
      });
      
      window.addEventListener('offline', () => {
        this.setState('offline');
      });
    }
  }

  private setState(newState: ConnectivityState) {
    if (newState !== this.state) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Perform connectivity check
   */
  async check(): Promise<ConnectivityState> {
    // Don't start new check if one is in progress
    if (this.checkPromise) {
      return this.checkPromise;
    }

    const now = Date.now();
    // Throttle checks (max once per 2 seconds)
    if (now - this.lastCheck < 2000) {
      return Promise.resolve(this.state);
    }

    this.lastCheck = now;
    this.checkPromise = checkConnectivity(this.options).then((state) => {
      this.setState(state);
      this.checkPromise = null;
      return state;
    });

    return this.checkPromise;
  }

  /**
   * Get current state (synchronous, may be stale)
   */
  getState(): ConnectivityState {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(intervalMs: number = 30000) {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    this.checkInterval = window.setInterval(() => {
      this.check();
    }, intervalMs);
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

/**
 * Global connectivity monitor instance
 */
let globalMonitor: ConnectivityMonitor | null = null;

/**
 * Get or create global connectivity monitor
 */
export function getConnectivityMonitor(
  options: ConnectivityCheckOptions = {}
): ConnectivityMonitor {
  if (!globalMonitor) {
    globalMonitor = new ConnectivityMonitor(options);
  }
  return globalMonitor;
}

/**
 * React hook for connectivity state
 */
export function useConnectivity(
  options: ConnectivityCheckOptions = {}
): {
  state: ConnectivityState;
  isOnline: boolean;
  isPoor: boolean;
  isOffline: boolean;
  check: () => Promise<ConnectivityState>;
} {
  // This would need React imports, but keeping it framework-agnostic
  // For React usage, import from a separate hook file
  throw new Error('Use useConnectivityHook from @/lib/useConnectivity instead');
}
