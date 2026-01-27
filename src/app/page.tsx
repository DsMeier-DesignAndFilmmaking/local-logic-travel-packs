'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPacks, getPack } from '../../scripts/offlineDB';
import { TravelPack } from '@/types/travel';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { normalizeCityName } from '@/lib/cities';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [initialPack, setInitialPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);
  const { isStandalone } = usePWAInstall();
  const hasRedirectedRef = useRef(false);

  // Hydration: Load pack from IndexedDB on mount (crucial for PWA icon launch)
  useEffect(() => {
    async function checkVault() {
      try {
        // If standalone mode, redirect to installed city pack ONLY on initial PWA launch
        // Allow explicit navigation to / (e.g., from Back to Home button)
        if (isStandalone && typeof window !== 'undefined') {
          const path = window.location.pathname;
          
          // If already on a city pack page, let it handle itself
          if (path.startsWith('/packs/')) {
            setLoading(false);
            return;
          }
          
          // Only redirect on initial PWA launch (when referrer is empty/external or first load)
          // Don't redirect if user explicitly navigated to / (e.g., via Back button)
          // Check if referrer is from same origin (internal navigation) - if so, don't redirect
          const referrer = document.referrer;
          const isInternalNavigation = referrer && referrer.includes(window.location.origin);
          const isInitialLaunch = !hasRedirectedRef.current && !isInternalNavigation;
          
          if (isInitialLaunch && path === '/') {
            hasRedirectedRef.current = true;
            
            // Try to get the installed city from URL or IndexedDB
            const urlParams = new URLSearchParams(window.location.search);
            const cityParam = urlParams.get('city');
            
            if (cityParam) {
              const cityPack = await getPack(cityParam);
              if (cityPack) {
                // Redirect to city pack page
                const normalizedCity = normalizeCityName(cityParam);
                router.push(`/packs/${normalizedCity}`);
                return;
              }
            }
            
            // Try to get most recent pack and redirect
            const saved = await getAllPacks();
            if (saved && saved.length > 0) {
              const normalizedCity = normalizeCityName(saved[0].city);
              router.push(`/packs/${normalizedCity}`);
              return;
            }
          }
        }
        
        // Default: Load most recent pack (non-standalone mode)
        const saved = await getAllPacks();
        if (saved && saved.length > 0) {
          // Properly typed - getAllPacks returns TravelPack[]
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
  }, [isStandalone, router]);

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