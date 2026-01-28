'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';
import { normalizeCityName } from '@/lib/cities';


interface OfflineDownloadProps {
  pack: TravelPack;
}

/**
 * ARCHITECT NOTE: 
 * This component acts as the 'Control Tower'. It coordinates between 
 * IndexedDB (Metadata) and the Service Worker (Asset Cache).
 */
export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'VERIFYING' | 'SAVED' | 'ERROR'>('IDLE');
  const [syncProgress, setSyncProgress] = useState(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const citySlug = normalizeCityName(pack.city);

  const statusRef = useRef(status);
    useEffect(() => {
      statusRef.current = status;
    }, [status]);

  // 1. Unified Verification Logic
  const verifyVault = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    
    setStatus('VERIFYING');
    const CACHE_VERSION = 'v2.2';
    const cityCacheName = `city-pack-${citySlug}-${CACHE_VERSION}`;
    const pageUrl = `/packs/${citySlug}`;

    try {
      const cache = await caches.open(cityCacheName);
      const match = await cache.match(pageUrl);
      
      if (match) {
        setStatus('SAVED');
        setSyncProgress(100);
      } else {
        setStatus('IDLE');
        setSyncProgress(0);
      }
    } catch (err) {
      console.error('Vault Verification Failed:', err);
      setStatus('ERROR');
    }
  }, [citySlug]);

  // 2. Listen for SW Heartbeats
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type !== 'SYNC_PROGRESS') return;

      // Ensure we only listen to progress for THIS specific city pack
      if (payload.citySlug === citySlug) {
        setSyncProgress(payload.progress);
        if (payload.progress === 100) {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          verifyVault();
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [citySlug, verifyVault]);

  // Initial check on mount
  useEffect(() => {
    if (pack?.city) {
      getPack(pack.city).then(existing => {
        if (existing) verifyVault();
      });
    }
  }, [pack?.city, verifyVault]);

  // 3. The "Tactical Sync" Trigger
  const handleSaveToVault = async () => {
    if (status === 'SYNCING' || status === 'SAVED') return;

    if (!navigator.onLine) {
      alert('Network required for initial tactical download.');
      return;
    }

    setStatus('SYNCING');
    setSyncProgress(10); // Initial engagement

    try {
      // Step A: Save metadata to IndexedDB
      await savePack({ ...pack, offlineReady: true });

      // Step B: Wake up the Service Worker
      const registration = await navigator.serviceWorker.ready;
      const sw = registration.active;

      const scripts = Array.from(document.scripts)
      .filter(s => s.src && s.src.includes('_next/static'))
      .map(s => s.src);

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(s => (s as HTMLLinkElement).href);

      const nextAssets = [
        ...Array.from(document.scripts)
          .filter(s => s.src && s.src.includes('_next/static'))
          .map(s => s.src),
        ...Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .map(s => (s as HTMLLinkElement).href)
      ];
      
      // 2. Add the dynamic manifest itself to the sync list
      const dynamicManifest = `/api/manifest/${citySlug}`;

      if (!sw) throw new Error("No active vault engine found.");

      // Step C: Dispatch the manifest for caching
      // We send the slug and the full data object so the SW knows exactly what to grab
      sw.postMessage({
        type: 'START_OFFLINE_SYNC',
        payload: {
          citySlug,
          url: window.location.pathname,
          assets: [
            window.location.pathname, // The HTML
            window.location.pathname + '?source=a2hs', // The exact start_url from manifest
            dynamicManifest,
            `/api/pack?city=${encodeURIComponent(pack.city)}`,
            ...nextAssets, // The JS/CSS "Engine"
          ]
        }
      });

      // Step D: Safety Timeout (If SW hangs)
        syncTimeoutRef.current = setTimeout(() => {
          // We check the REF, because the 'status' variable from the 
          // outer scope is "stale" inside this closure.
          if (statusRef.current === 'SYNCING') {
            console.error("Sync timed out.");
            setStatus('ERROR');
            // Optional: add a progress reset or specific error message
            setSyncProgress(0);
          }
        }, 30000);

    } catch (err) {
      console.error('Vault Sync Error:', err);
      setStatus('ERROR');
      setSyncProgress(0);
    }
  };

  return (
    <section className="p-6 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Storage Integrity</h4>
          <p className="text-slate-500 text-[10px] mt-1">
            {status === 'VERIFYING' && "Verifying checksums..."}
            {status === 'SAVED' && "Hardware verified"}
            {status === 'SYNCING' && "Downloading tactical assets..."}
            {status === 'ERROR' && "Sync failed - Retry?"}
            {status === 'IDLE' && "Pending sync"}
          </p>
        </div>
        <span className="text-emerald-400 text-xs font-mono">{Math.round(syncProgress)}%</span>
      </div>

      <div className="w-full h-1 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${status === 'SAVED' ? 'bg-emerald-400' : 'bg-emerald-500/50'}`}
          style={{ width: `${syncProgress}%` }}
        />
      </div>

      <button 
        onClick={handleSaveToVault}
        
        disabled={status === 'SYNCING' || status === 'SAVED' || status === 'VERIFYING'}
        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border ${
          status === 'SAVED' 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default" 
            : status === 'ERROR'
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : "bg-white text-slate-900 border-transparent active:scale-[0.98] hover:bg-slate-100"
        }`}
      >
        {status === 'SYNCING' ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Hardening Vault...
          </span>
          
        ) : status === 'VERIFYING' ? (
          "Verifying Checksums..."
        ) : status === 'SAVED' ? (
          "✓ SECURED FOR FLIGHT"
        ) : (
          "Sync Tactical Vault"
        )}
        
      </button>
      
    </section>
  );
}