'use client';

import { useEffect } from 'react';

/**
 * Global Service Worker Registration (HOMEPAGE ONLY)
 */
export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const pathname = window.location.pathname;

    // 🚫 Never register root SW on city pages
    if (pathname.startsWith('/packs/')) {
      console.log('⛔ Root SW blocked on city route');
      return;
    }

    // 🚫 Root SW registration removed
    // Only CitySWRegister.tsx should register service workers for /packs/<city> routes
    // Homepage does not need a service worker
    console.log('ℹ️ Root SW registration skipped - using city-specific SWs only');
  }, []);

  return null;
}
