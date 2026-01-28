'use client';

import { useEffect } from 'react';

/**
 * Tactical Vault: Pre-emptive Sync Engine
 * Ensures city packs are cached in the background while the user 
 * is still viewing the "Add to Home Screen" instructions.
 */
export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        // FUNCTION: Trigger the Aggressive Sync
        const triggerVaultSync = () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_URL',
              payload: window.location.href
            });
            console.log('📡 Vault Sync: Background caching initiated.');
          }
        };

        // 1. If the page is already controlled, sync immediately
        if (navigator.serviceWorker.controller) {
          triggerVaultSync();
        } else {
          // 2. If not controlled (first visit), wait for the worker to take over
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🎮 SW Controller acquired. Starting sync...');
            triggerVaultSync();
          });
        }

        // 3. Force update check to ensure user has the latest "Shortcuts"
        registration.update();

        // 4. Handle installation of new versions
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          installingWorker?.addEventListener('statechange', () => {
            if (installingWorker.state === 'activated') {
              triggerVaultSync();
            }
          });
        });

      } catch (error) {
        console.error('⚠️ Vault Sync Error:', error);
      }
    };

    registerSW();
  }, []);

  return null;
}