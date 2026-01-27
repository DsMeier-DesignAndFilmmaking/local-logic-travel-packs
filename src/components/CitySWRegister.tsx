'use client';

import { useEffect } from 'react';
import { normalizeCityName } from '@/lib/cities';

interface CitySWRegisterProps {
  city: string;
}

/**
 * City-Specific Service Worker Registration
 * 
 * Registers service worker with city-specific scope to ensure
 * each city installation only caches and manages that city's data.
 * 
 * Scope: /packs/{city}
 * Example: /packs/bangkok
 */
export default function CitySWRegister({ city }: CitySWRegisterProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const pathname = window.location.pathname;
    const normalizedCity = normalizeCityName(city);
    const cityScope = `/packs/${normalizedCity}`;

    // 🚫 Only register if we're on the correct city page
    if (!pathname.startsWith(cityScope)) {
      console.log(`⛔ City SW registration blocked: pathname ${pathname} does not match scope ${cityScope}`);
      return;
    }

    const registerCitySW = async () => {
      try {
        // Check if there's already a service worker registered
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        
        // Unregister any service workers with different scopes
        // This ensures we only have one service worker per city installation
        for (const registration of existingRegistrations) {
          if (registration.scope !== `${window.location.origin}${cityScope}/`) {
            // Only unregister if it's not the current city's scope
            // Keep the current city's service worker
            const currentScope = `${window.location.origin}${cityScope}/`;
            if (registration.scope !== currentScope) {
              await registration.unregister();
              console.log('🔄 Unregistered service worker with scope:', registration.scope);
            }
          }
        }

        // Register service worker with city-specific scope
        // Ensure scope ends with / for proper isolation
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: `${cityScope}/`,
        });

        console.log(`🛡️ City Service Worker registered for ${city}:`, reg.scope);

        // Handle controller changes
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        // Immediate update check
        if (reg) {
          reg.update();
        }

        // Update found logic
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log(`✨ City SW Update: New version installed for ${city}.`);
                } else {
                  console.log(`✅ City SW Ready: Content cached for ${city}.`);
                }
              }
            };
          }
        };

        // Send city context to service worker
        const sendCityContext = (target: ServiceWorker) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'CITY_CONTEXT_SET') {
              console.log(`✅ City context confirmed in SW: ${event.data.city}`);
            }
          };
          
          target.postMessage(
            {
              type: 'SET_CITY_CONTEXT',
              payload: { city: normalizedCity, displayCity: city }
            },
            [messageChannel.port2]
          );
        };

        if (navigator.serviceWorker.controller) {
          sendCityContext(navigator.serviceWorker.controller);
        }

        // Listen for service worker ready
        navigator.serviceWorker.ready.then((registration) => {
          // Send city context when service worker becomes ready
          if (registration.active) {
            sendCityContext(registration.active);
          }
        });

      } catch (err) {
        console.error(`❌ City SW registration failed for ${city}:`, err);
      }
    };

    if (document.readyState === 'complete') {
      registerCitySW();
    } else {
      window.addEventListener('load', registerCitySW);
      return () => window.removeEventListener('load', registerCitySW);
    }
  }, [city]);

  return null;
}
