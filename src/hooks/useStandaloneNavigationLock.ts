'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePWAInstall } from './usePWAInstall';
import { normalizeCityName } from '@/lib/cities';

/**
 * Hook to lock navigation in standalone mode
 * 
 * Prevents navigation to other city packs when app is installed.
 * Shows "Download Required" modal if user tries to access other cities.
 */
export function useStandaloneNavigationLock(currentCity?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isStandalone } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [targetCity, setTargetCity] = useState<string | undefined>();

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
        
        // Prevent navigation by going back or staying on current city
        // Note: We can't prevent the navigation itself, but we can show the modal
        // and the page component will handle the restriction
      }
    }
  }, [pathname, isStandalone, currentCity]);

  // Intercept router.push calls in standalone mode
  useEffect(() => {
    if (!isStandalone || !currentCity) return;

    const currentNormalizedCity = normalizeCityName(currentCity);
    
    // Override router.push to intercept navigation
    const originalPush = router.push;
    
    router.push = ((url: string) => {
      // Check if trying to navigate to a different city pack
      const packRouteMatch = url.match(/^\/packs\/([^/]+)/);
      
      if (packRouteMatch) {
        const targetPathCity = packRouteMatch[1];
        const targetNormalizedCity = normalizeCityName(targetPathCity);
        
        if (targetNormalizedCity !== currentNormalizedCity) {
          // Different city - show modal and prevent navigation
          setTargetCity(targetPathCity);
          setShowModal(true);
          return Promise.resolve(false);
        }
      }
      
      // Allow navigation to same city or non-pack routes
      return originalPush.call(router, url);
    }) as typeof router.push;
    
    return () => {
      router.push = originalPush;
    };
  }, [isStandalone, currentCity, router]);

  return {
    showModal,
    setShowModal,
    targetCity,
  };
}
