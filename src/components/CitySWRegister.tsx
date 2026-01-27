'use client';

import { useEffect } from 'react';

/**
 * City-Specific Service Worker Registration
 * 
 * Registers service worker with city-specific scope to ensure
 * each city installation only caches and manages that city's data.
 * 
 * Scope: /packs/{city}/
 * Example: /packs/bangkok/
 * 
 * This component:
 * - Only registers SWs for city pages
 * - Does NOT block navigation
 * - Handles errors gracefully
 */
export default function CitySWRegister({ city }: { city: string }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const cityScope = `/packs/${city}/`;
    
    // Only register if we're on the correct city page
    const pathname = window.location.pathname;
    if (!pathname.startsWith(`/packs/${city}`)) {
      console.log(`⛔ City SW registration blocked: pathname ${pathname} does not match scope ${cityScope}`);
      return;
    }

    const registerCitySW = async () => {
      try {
        console.log(`Registering city SW for: ${cityScope}`);
        
        // Note: /sw.js may not exist if using city-scoped SWs only
        // This is expected and should not block navigation
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: cityScope,
        });
        
        console.log(`✅ City SW registered for ${city}:`, registration.scope);
      } catch (err) {
        // Do NOT block navigation on SW registration failure
        // Failed SW registration is non-critical - app should work offline via IndexedDB
        console.warn(`⚠️ City SW registration failed for ${city}:`, err);
        console.warn(`   This is non-critical - app will use IndexedDB for offline access`);
      }
    };

    registerCitySW();
  }, [city]);

  return null;
}