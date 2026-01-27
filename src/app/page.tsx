'use client';

import { useState, useEffect } from 'react';
import { getAllPacks } from '../../scripts/offlineDB';
import { TravelPack } from '@/types/travel';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';

export default function Home() {
  const [initialPack, setInitialPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkVault() {
      const saved = await getAllPacks();
      if (saved && saved.length > 0) {
        setInitialPack(saved[0] as unknown as TravelPack);
      }
      setLoading(false);
    }
    checkVault();
  }, []);

  if (loading) return null; // Or a simple spinner

  return (
    <main className="min-h-screen bg-white p-4">
      <TravelPackCitySelector initialPack={initialPack} />
    </main>
  );
}