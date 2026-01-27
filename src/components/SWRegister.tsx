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

    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('🛡️ Root SW registered:', reg.scope);
        await reg.update();
      } catch (err) {
        console.error('❌ Root SW registration failed', err);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
