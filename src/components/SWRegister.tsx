'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      
      // 1. Handle Controller Changes
      // This ensures that if the SW is updated in the background, 
      // the app reloads to ensure the UI is in sync with the new logic.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          console.log('🛡️ Tactical Vault: Service Worker active', reg.scope);

          // 2. Immediate Update Check
          // This tells Safari: "Check for a newer sw.js immediately."
          if (reg) {
            reg.update();
          }

          // 3. Update Found Logic
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available; the 'controllerchange' 
                    // event above will handle the reload if we call skipWaiting() 
                    // in the sw.js itself.
                    console.log('✨ Vault Update: New version installed.');
                  } else {
                    console.log('✅ Vault Ready: Content is cached for offline use.');
                  }
                }
              };
            }
          };
        } catch (err) {
          console.error('❌ Vault Error: SW registration failed', err);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}