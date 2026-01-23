/**
 * React Hook for Connectivity State
 * 
 * Provides reactive connectivity state for React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ConnectivityState,
  ConnectivityMonitor,
  getConnectivityMonitor,
  checkConnectivityNonBlocking,
} from './connectivity';

export interface UseConnectivityOptions {
  checkOnMount?: boolean;
  monitorInterval?: number;
  onStateChange?: (state: ConnectivityState) => void;
}

export interface UseConnectivityReturn {
  state: ConnectivityState;
  isOnline: boolean;
  isPoor: boolean;
  isOffline: boolean;
  check: () => Promise<ConnectivityState>;
  isChecking: boolean;
}

/**
 * React hook for connectivity state
 */
export function useConnectivity(
  options: UseConnectivityOptions = {}
): UseConnectivityReturn {
  const {
    checkOnMount = true,
    monitorInterval,
    onStateChange,
  } = options;

  const [state, setState] = useState<ConnectivityState>(() => {
    // Initial state from navigator.onLine
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return 'online';
    }
    return 'offline';
  });

  const [isChecking, setIsChecking] = useState(false);
  const [monitor, setMonitor] = useState<ConnectivityMonitor | null>(null);

  // Initialize monitor
  useEffect(() => {
    const connectivityMonitor = getConnectivityMonitor({
      onStateChange: (newState) => {
        setState(newState);
        if (onStateChange) {
          onStateChange(newState);
        }
      },
    });

    setMonitor(connectivityMonitor);

    // Start monitoring if interval provided
    if (monitorInterval) {
      connectivityMonitor.startMonitoring(monitorInterval);
    }

    // Initial check
    if (checkOnMount) {
      const { immediateState, promise } = checkConnectivityNonBlocking();
      setState(immediateState);
      
      promise.then((refinedState) => {
        setState(refinedState);
        if (onStateChange) {
          onStateChange(refinedState);
        }
      });
    }

    return () => {
      if (monitorInterval) {
        connectivityMonitor.stopMonitoring();
      }
    };
  }, [checkOnMount, monitorInterval, onStateChange]);

  // Subscribe to monitor updates
  useEffect(() => {
    if (!monitor) return;

    const unsubscribe = monitor.subscribe((newState) => {
      setState(newState);
      if (onStateChange) {
        onStateChange(newState);
      }
    });

    return unsubscribe;
  }, [monitor, onStateChange]);

  // Manual check function
  const check = useCallback(async (): Promise<ConnectivityState> => {
    if (!monitor) {
      // Fallback if monitor not initialized
      const { immediateState, promise } = checkConnectivityNonBlocking();
      setState(immediateState);
      setIsChecking(true);
      
      const refinedState = await promise;
      setState(refinedState);
      setIsChecking(false);
      return refinedState;
    }

    setIsChecking(true);
    const newState = await monitor.check();
    setState(newState);
    setIsChecking(false);
    return newState;
  }, [monitor]);

  return {
    state,
    isOnline: state === 'online',
    isPoor: state === 'poor',
    isOffline: state === 'offline',
    check,
    isChecking,
  };
}
