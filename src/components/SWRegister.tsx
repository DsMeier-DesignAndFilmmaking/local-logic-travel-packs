// src/components/SWRegister.tsx
'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    // Check for service worker support and ensure we are in a browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          console.log('🛡️ Tactical Vault: Service Worker active', reg.scope);
        } catch (err) {
          console.error('❌ Vault Error: SW registration failed', err);
        }
      };

      // Register only after page is fully loaded to avoid blocking main thread
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