'use client';

import { useState, useEffect } from 'react';
import { getAllPacks, getPack } from '../../scripts/offlineDB';
import { TravelPack } from '@/types/travel';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';
import Footer from '@/components/Footer';

export default function Home() {
  const [initialPack, setInitialPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);
  const { isStandalone } = usePWAInstall();

  // Hydration: Load pack from IndexedDB on mount (crucial for PWA icon launch)
  useEffect(() => {
    async function checkVault() {
      try {
        // If standalone mode, try to recover from URL path first (offline recovery)
        if (isStandalone && typeof window !== 'undefined') {
          const path = window.location.pathname;
          // Check if path indicates a city (e.g., /packs/paris or query param)
          const urlParams = new URLSearchParams(window.location.search);
          const cityParam = urlParams.get('city');
          
          if (cityParam) {
            // Try to load specific city from IndexedDB
            const cityPack = await getPack(cityParam);
            if (cityPack) {
              setInitialPack(cityPack);
              setLoading(false);
              return; // Bypass network, use offline data
            }
          }
        }
        
        // Default: Load most recent pack
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
  }, []);

  // Show minimal loading state (prevents flash of empty content)
  if (loading) {
    return (
      <main className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col">
      <div className="flex-1">
        <TravelPackCitySelector initialPack={initialPack} />
      </div>
      <Footer />
    </main>
  );
}