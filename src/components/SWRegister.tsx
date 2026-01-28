'use client';

import { useEffect } from 'react';

/**
 * Tactical Vault: SW Lifecycle Manager
 * Responsibility: Registration and background updates only.
 * Handshakes for data sync are handled via the 'OfflineDownload' component.
 */
export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        // 1. Register the worker
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/' 
        });

        // 2. Handle background updates
        // If a new version of the worker is found, check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, new content is available but the old SW is still controlling
                console.log('🔄 New tactical updates available. Will apply on next reload.');
              } else {
                // Content is cached for the first time
                console.log('🛡️ Tactical Vault initialized for the first time.');
              }
            }
          };
        };

        // 3. Keep the worker "warm"
        // This ensures the update check runs frequently
        registration.update();

      } catch (error) {
        console.error('⚠️ Vault Registration Error:', error);
      }
    };

    registerSW();
  }, []);

  return null;
}