'use client';

import { useEffect } from 'react';

/**
 * Tactical Vault Service Worker Registration
 * Forces immediate caching of city packs for 100% offline use.
 */
export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        // FUNCTION: Send the cache command to the worker
        const sendCacheMessage = () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_URL',
              payload: window.location.href
            });
            console.log('📡 Tactical Sync: Caching current city pack...');
          }
        };

        // 1. If already active and controlling the page, send message immediately
        if (registration.active) {
          sendCacheMessage();
        }

        // 2. If a new worker is installing (first visit), wait for it to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('✅ SW Activated: Claiming control...');
              // Force the new service worker to take control immediately
              sendCacheMessage();
            }
          });
        });

        console.log('✅ SW Registered:', registration.scope);
      } catch (error) {
        console.error('⚠️ SW Error:', error);
      }
    };

    registerSW();
  }, []);

  return null;
}