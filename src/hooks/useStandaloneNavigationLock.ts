'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePWAInstall } from './usePWAInstall';
import { normalizeCityName } from '@/lib/cities';

/**
 * Hook to lock navigation in standalone mode
 * 
 * Prevents navigation to other city packs when app is installed.
 * Shows "Download Required" modal if user tries to access other cities.
 * 
 * IMPORTANT: Does NOT override router methods. Provides a guarded navigation helper instead.
 */
export function useStandaloneNavigationLock(currentCity?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isStandalone } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [targetCity, setTargetCity] = useState<string | undefined>();

  // Check pathname changes for unauthorized city access
  useEffect(() => {
    if (!isStandalone || !currentCity) return;

    // Extract city from current pathname
    const currentNormalizedCity = normalizeCityName(currentCity);
    
    // Check if pathname is a city pack route
    const packRouteMatch = pathname?.match(/^\/packs\/([^/]+)/);
    
    if (packRouteMatch) {
      const pathCity = packRouteMatch[1];
      const pathNormalizedCity = normalizeCityName(pathCity);
      
      // If trying to access a different city pack
      if (pathNormalizedCity !== currentNormalizedCity) {
        setTargetCity(pathCity);
        setShowModal(true);
        
        // Redirect back to current city's pack page
        router.replace(`/packs/${currentNormalizedCity}`);
      }
    }
  }, [pathname, isStandalone, currentCity, router]);

  /**
   * Guarded navigation helper
   * 
   * Allows all non-pack routes (/, /privacy, etc.)
   * Guards navigation only when moving between different city packs
   * Shows modal when attempting to switch cities in standalone mode
   * Calls router.push(url) normally when allowed
   */
  const guardedPush = useCallback((url: string) => {
    // Always allow navigation if not in standalone mode or no current city
    if (!isStandalone || !currentCity) {
      router.push(url);
      return;
    }

    const currentNormalizedCity = normalizeCityName(currentCity);
    const packMatch = url.match(/^\/packs\/([^/]+)/);

    if (packMatch) {
      const targetCity = normalizeCityName(packMatch[1]);

      if (targetCity !== currentNormalizedCity) {
        // Different city - show modal and prevent navigation
        setTargetCity(packMatch[1]);
        setShowModal(true);
        return;
      }
    }

    // Allow navigation to same city or non-pack routes
    router.push(url);
  }, [isStandalone, currentCity, router]);

  return {
    showModal,
    setShowModal,
    targetCity,
    guardedPush,
  };
}
