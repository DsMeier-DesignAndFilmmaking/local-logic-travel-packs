'use client';

import { useState, useEffect } from 'react';
import { getAllPacks } from '../../scripts/offlineDB';
import { TravelPack } from '@/lib/travelPacks';
import TravelPackCitySelector from '@/components/TravelPackCitySelector';
import Spontaneity from '@/components/Spontaneity';

export default function Home() {
  const [recoveredPack, setRecoveredPack] = useState<TravelPack | null>(null);
  const [isRecovering, setIsRecovering] = useState(true);

  useEffect(() => {
    async function recoverVault() {
      try {
        // 1. Check IndexedDB for any saved assets
        const savedPacks = await getAllPacks();
        
        if (savedPacks && savedPacks.length > 0) {
          // 2. Tactical Recovery: Load the most recent city
          console.log("🛡️ Vault: Asset recovered from offline storage");
          setRecoveredPack(savedPacks[0] as unknown as TravelPack);
        }
      } catch (err) {
        console.error("Vault Recovery Failed", err);
      } finally {
        // 3. Stop loading spinner once DB check is done
        setIsRecovering(false);
      }
    }

    recoverVault();
  }, []);

  if (isRecovering) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Booting Vault...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* If a pack was recovered, we pass it as 'initialPack'.
          If NOT, we show Spontaneity until they search for something.
      */}
      <div className="pt-10">
        <TravelPackCitySelector initialPack={recoveredPack} />
        
        {/* Only show Spontaneity if there is no active city loaded */}
        {!recoveredPack && <Spontaneity pack={recoveredPack as any} />}
      </div>
    </main>
  );
}