'use client';

import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // 1. Detect Standalone Mode
    const checkStandalone = () => {
      const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true;
      setIsStandalone(isSA);
    };

    // 2. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Handle Chrome/Android Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    checkStandalone();
    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for the app being installed successfully
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('🚀 Vault installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = async () => {
    if (platform === 'ios') {
      // iOS doesn't support programmatic install; 
      // This tells the UI to show the "Share > Add to Home Screen" modal
      return 'ios_manual'; 
    }

    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { 
    triggerInstall, 
    // canInstall is true if Chrome prompt is ready OR if it's iOS (manual path)
    canInstall: !!deferredPrompt || (platform === 'ios' && !isStandalone), 
    isStandalone,
    platform 
  };
}