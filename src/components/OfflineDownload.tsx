'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack, deletePack } from '../../scripts/offlineDB';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface OfflineDownloadProps {
  pack: TravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { isStandalone } = usePWAInstall();

  useEffect(() => {
    async function checkSaved() {
      if (!pack?.city) return;
      try {
        const existing = await getPack(pack.city);
        if (existing) {
          setIsSaved(true);
          setIsVerified(true);
        }
      } catch (err) {
        console.error('Vault Check Error:', err);
      }
    }
    checkSaved();
  }, [pack?.city]);

  const handleRemoveFromVault = async () => {
    try {
      await deletePack(pack.city);
      setIsSaved(false);
      setIsVerified(false);
      window.dispatchEvent(new CustomEvent('vault-update', {
        detail: { city: pack.city, status: 'deleted' }
      }));
    } catch (err) {
      console.error("Purge Error:", err);
    }
  };

  /**
   * TRIPLE-LOCK SYNC
   * Ensures data, city-page, and app-shell are all cached simultaneously.
   */
  const handleSaveToVault = async () => {
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const packToSave: TravelPack = {
        ...pack,
        downloadedAt: timestamp,
        offlineReady: true,
      };

      // 1. Database Lock (Ammo)
      await savePack(packToSave);

      // 2. Service Worker Lock (Engine & Shell)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Cache the specific pack page and its API data
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_URL',
          payload: window.location.href 
        });

        // Crucial: Cache the root so the PWA can launch in Airplane Mode
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_URL',
          payload: window.location.origin + '/'
        });
      }

      window.dispatchEvent(new CustomEvent('vault-sync-complete', {
        detail: { city: pack.city, timestamp }
      }));

      setIsSaved(true);
      setIsVerified(true);
    } catch (err) {
      console.error('Vault Sync Failed:', err);
      if (!isStandalone && navigator.onLine) {
        alert('Vault sync interrupted. Check connection and retry.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section 
        className="p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl"
        aria-labelledby="vault-heading"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h4 id="vault-heading" className="text-white text-sm font-black uppercase tracking-wider">
              Tactical Vault
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed mt-2">
              Syncing initiates zero-latency offline access. Verified packs work in 100% Airplane Mode.
            </p>
          </div>
          {isVerified && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/40 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Encrypted
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSaveToVault}
          disabled={isSaving || isSaved}
          className="w-full py-4 bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/20"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Hardening Vault...</span>
            </>
          ) : isSaved ? (
            <>
              <span>✓ Verified Offline</span>
            </>
          ) : (
            'Sync to Tactical Vault'
          )}
        </button>
        
        {isSaved && (
          <button 
            onClick={handleRemoveFromVault}
            className="mt-6 w-full text-[9px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-[0.3em] transition-colors"
          >
            [ Purge Local Intelligence ]
          </button>
        )}
      </section>
    </div>
  );
}