'use client';

import { useState, useEffect, useCallback } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';

interface OfflineDownloadProps {
  pack: TravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyVault = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    
    setIsVerifying(true);
    const CACHE_VERSION = 'v2.2'; 
    const cacheName = `city-pack-${pack.city}-${CACHE_VERSION}`;
    
    try {
      const cache = await caches.open(cacheName);
      const [hasPage, hasData] = await Promise.all([
        cache.match(window.location.href),
        cache.match(`/api/pack?city=${pack.city}`)
      ]);

      if (hasPage && hasData) {
        setIsSaved(true);
        setSyncProgress(100);
      } else {
        setIsSaved(false);
        setSyncProgress(0);
      }
    } catch (err) {
      console.error('❌ Verification Failed:', err);
      setIsSaved(false);
    } finally {
      setIsVerifying(false);
      setIsSaving(false); // Ensure button stops spinning
    }
  }, [pack.city]);

  useEffect(() => {
    async function checkSaved() {
      if (!pack?.city) return;
      try {
        const existing = await getPack(pack.city);
        if (existing) verifyVault();
      } catch (err) {
        console.error('Vault Check Error:', err);
      }
    }
    checkSaved();
  }, [pack?.city, verifyVault]);

  // 3. Updated Listener to handle City and Root messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type !== 'SYNC_PROGRESS') return;
  
      if (payload.city === pack.city) {
        // Start the bar at at least 15% once the SW confirms it's working
        const actualProgress = Math.max(payload.progress, 15);
        setSyncProgress(actualProgress);
        
        if (payload.progress === 100) {
          setTimeout(() => verifyVault(), 1000);
        }
      }
    };
  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [pack.city, verifyVault]);

  const handleSaveToVault = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    setSyncProgress(5); 
  
    try {
      await savePack({ ...pack, offlineReady: true });
  
      if (!('serviceWorker' in navigator)) {
        throw new Error("SW not supported");
      }
  
      // FIX: If the SW is active but not "controlling", we force it to take over
      let sw = navigator.serviceWorker.controller;
      
      if (!sw) {
        const reg = await navigator.serviceWorker.ready;
        sw = reg.active; // Fallback to the active worker if no controller
      }
  
      if (sw) {
        sw.postMessage({ type: 'CACHE_URL', payload: window.location.href });
        sw.postMessage({ type: 'CACHE_URL', payload: window.location.origin + '/' });
      } else {
        alert("Vault offline engine starting. Please refresh and try again.");
        setSyncProgress(0);
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Vault Error:', err);
      setSyncProgress(0);
      setIsSaving(false);
    }
  };

  return (
    <section className="p-6 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Storage Integrity</h4>
          <p className="text-slate-500 text-[10px] mt-1">
            {isVerifying ? "Verifying checksums..." : isSaved ? "Hardware verified" : "Pending sync"}
          </p>
        </div>
        <span className="text-emerald-400 text-xs font-mono">{syncProgress}%</span>
      </div>

      <div className="w-full h-1 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ${isSaved ? 'bg-emerald-400' : 'bg-emerald-500/50'}`}
          style={{ width: `${syncProgress}%` }}
        />
      </div>

      <button 
        onClick={handleSaveToVault}
        disabled={isSaving || isSaved || isVerifying}
        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border ${
          isSaved 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default" 
            : "bg-white text-slate-900 border-transparent active:scale-[0.98] hover:bg-slate-100"
        }`}
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Hardening Vault...
          </span>
        ) : isVerifying ? (
          "Verifying Checksums..."
        ) : isSaved ? (
          "✓ SECURED FOR FLIGHT"
        ) : (
          "Sync Tactical Vault"
        )}
      </button>
    </section>
  );
}