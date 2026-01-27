'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('✅ SW Active:', registration.scope);

        // PROACTIVE FIX: Tell the SW to cache the current URL immediately
        // This is what makes the "City Pack" work offline instantly.
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_URL',
            payload: window.location.href
          });
        }

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Tactical Update Available.');
            }
          });
        });
      } catch (error) {
        console.error('⚠️ SW Error:', error);
      }
    };

    registerSW();
  }, []);

  return null;
}