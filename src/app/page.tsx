'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAllPacks, getPack } from '../../scripts/offlineDB';
import { TravelPack } from '@/types/travel';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { normalizeCityName } from '@/lib/cities';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [initialPack, setInitialPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);
  const { isStandalone } = usePWAInstall();
  const hasRedirectedRef = useRef(false);
  
  // Guard: Never redirect when on root "/" route
  const isHome = pathname === '/';

  // Hydration: Load pack from IndexedDB on mount
  // GUARD: Never run redirect logic when pathname === '/'
  // Redirects only occur when user explicitly enters a city flow (pathname starts with '/packs/')
  useEffect(() => {
    async function checkVault() {
      try {
        // ESCAPE HATCH: Check for explicit user intent to go home
        // If allowHome flag is set, skip all redirects and clear the flag
        if (typeof window !== 'undefined') {
          const allowHome = localStorage.getItem('allowHome');
          if (allowHome === 'true') {
            // User explicitly clicked "Back to Home" - respect their intent
            localStorage.removeItem('allowHome');
            // Load data but never redirect - user stays on home
            const saved = await getAllPacks();
            if (saved && saved.length > 0) {
              setInitialPack(saved[0]);
            }
            setLoading(false);
            return;
          }
        }
        
        // GUARD: When on home, only load data - never redirect
        // This prevents auto-forcing city pages on app mount/hydration
        if (isHome) {
          const saved = await getAllPacks();
          if (saved && saved.length > 0) {
            setInitialPack(saved[0]);
          }
          setLoading(false);
          return;
        }
        
        // Only run redirect logic when user is explicitly in a city flow
        // This means pathname must start with '/packs/' or be another non-home route
        const isInCityFlow = pathname?.startsWith('/packs/');
        
        // If standalone mode AND user is explicitly in a city flow (not on home)
        // Only redirect when user has explicitly entered a city flow, not on mount/hydration
        if (isStandalone && isInCityFlow && typeof window !== 'undefined') {
          // User is already on a city pack page - let it handle itself
          setLoading(false);
          return;
        }
        
        // For non-standalone mode or when not in city flow, just load pack data
        // No redirects - user stays where they are
        const saved = await getAllPacks();
        if (saved && saved.length > 0) {
          setInitialPack(saved[0]);
        }
      } catch (error) {
        console.error('Failed to load from vault:', error);
      } finally {
        setLoading(false);
      }
    }
    checkVault();

    // Listen for vault sync events (when pack is saved)
    const handleVaultSync = async (event: Event) => {
      // Reload from IndexedDB to get the latest saved pack
      try {
        const saved = await getAllPacks();
        if (saved && saved.length > 0) {
          setInitialPack(saved[0]);
        }
      } catch (error) {
        console.error('Failed to reload from vault:', error);
      }
    };

    window.addEventListener('vault-sync-complete', handleVaultSync);
    
    return () => {
      window.removeEventListener('vault-sync-complete', handleVaultSync);
    };
  }, [isStandalone, router, isHome]);

  // Show minimal loading state (prevents flash of empty content)
  if (loading) {
    return (
      <main className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // In standalone mode, show homepage if user explicitly navigated here
  // (Initial PWA launch will redirect via useEffect above)
  // Allow / to be accessible even in standalone mode for explicit navigation

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col">
      <div className="flex-1">
        <TravelPackCitySelector initialPack={initialPack} />
      </div>
      <Footer />
    </main>
  );
}