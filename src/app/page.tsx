'use client';

import { useState, useEffect } from 'react';
import { getAllPacks } from '../../scripts/offlineDB';
import { TravelPack } from '@/types/travel';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';
import Footer from '@/components/Footer';

export default function Home() {
  const [initialPack, setInitialPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydration: Load pack from IndexedDB on mount (crucial for PWA icon launch)
  useEffect(() => {
    async function checkVault() {
      try {
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
    const handleVaultSync = async (event: CustomEvent) => {
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

    window.addEventListener('vault-sync-complete', handleVaultSync as EventListener);
    
    return () => {
      window.removeEventListener('vault-sync-complete', handleVaultSync as EventListener);
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