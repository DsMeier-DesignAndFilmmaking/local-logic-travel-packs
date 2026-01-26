'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          console.log('🛡️ Tactical Vault: Service Worker active', reg.scope);

          // FORCE UPDATE CHECK: 
          // On Home Screen apps, sometimes the SW gets "lazy." 
          // This forces a check for new code every time the app is opened.
          reg.update();

          // Handle version updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✨ New version available! Reloading...');
                  window.location.reload();
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