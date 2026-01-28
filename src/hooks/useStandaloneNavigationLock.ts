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
  const { isStandalone, platform } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [targetCity, setTargetCity] = useState<string | undefined>();

  // Lock navigation only for MOBILE standalone installs.
  // Desktop "installed" PWAs should behave like the full multi-city web app.
  const lockActive = isStandalone && (platform === 'ios' || platform === 'android');

  // Check pathname changes for unauthorized city access
  // Navigation locking ONLY applies to /packs/[city] → /packs/[otherCity]
  useEffect(() => {
    // Early exit: Lock only applies for mobile standalone
    if (!lockActive) return;
    
    // Early exit: No current city defined
    if (!currentCity) return;
    
    // Early exit: / is a global escape route - never intercepted
    if (pathname === '/') return;
    
    // Early exit: Non-/packs/* routes are unrestricted
    if (!pathname?.startsWith('/packs/')) return;
    
    // At this point, we know:
    // - lockActive === true (mobile standalone)
    // - currentCity is defined
    // - pathname is a /packs/[city] route
    
    const currentNormalizedCity = normalizeCityName(currentCity);
    
    // Extract city from pathname
    const packRouteMatch = pathname.match(/^\/packs\/([^/]+)/);
    if (!packRouteMatch) return;
    
    const pathCity = packRouteMatch[1];
    const pathNormalizedCity = normalizeCityName(pathCity);
    
    // Only guard if trying to access a different city pack
    if (pathNormalizedCity !== currentNormalizedCity) {
      setTargetCity(pathCity);
      setShowModal(true);
      
      // Redirect back to current city's pack page
      router.replace(`/packs/${currentNormalizedCity}`);
    }
  }, [pathname, lockActive, currentCity, router]);

  /**
   * Guarded navigation helper
   * 
   * Navigation locking ONLY applies to /packs/[city] → /packs/[otherCity]
   * 
   * Invariants:
   * - / is a global escape route (always allowed)
   * - Non-/packs/* routes are unrestricted (always allowed)
   * - Only cross-city pack navigation is guarded
   */
  const guardedPush = useCallback((url: string) => {
    // Early exit: Lock only applies for mobile standalone with a known current city
    if (!lockActive || !currentCity) {
      router.push(url);
      return;
    }

    // Early exit: / is a global escape route - always allowed
    if (url === '/') {
      router.push(url);
      return;
    }

    // Early exit: Non-/packs/* routes are unrestricted - always allowed
    if (!url.startsWith('/packs/')) {
      router.push(url);
      return;
    }

    // At this point, we know:
    // - lockActive === true (mobile standalone)
    // - currentCity is defined
    // - url is a /packs/[city] route
    
    const currentNormalizedCity = normalizeCityName(currentCity);
    const packMatch = url.match(/^\/packs\/([^/]+)/);

    if (packMatch) {
      const targetCity = normalizeCityName(packMatch[1]);

      // Only guard if trying to navigate to a different city pack
      if (targetCity !== currentNormalizedCity) {
        // Different city - show modal and prevent navigation
        setTargetCity(packMatch[1]);
        setShowModal(true);
        return;
      }
    }

    // Allow navigation to same city pack
    router.push(url);
  }, [lockActive, currentCity, router]);

  return {
    showModal,
    setShowModal,
    targetCity,
    guardedPush,
  };
}
