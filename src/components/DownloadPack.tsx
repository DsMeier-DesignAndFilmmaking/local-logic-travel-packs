'use client';

import { useState, useEffect, useCallback } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';
import { normalizeCityName } from '@/lib/cities';

interface DownloadPackProps {
  pack: TravelPack;
}

export default function DownloadPack({ pack }: DownloadPackProps) {
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const [progress, setProgress] = useState(0);

  const citySlug = normalizeCityName(pack.city);

  // Sync Progress Listener (Connecting to our new SW logic)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_PROGRESS' && payload.citySlug === citySlug) {
        setProgress(payload.progress);
        if (payload.progress === 100) setStatus('SUCCESS');
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [citySlug]);

  const handleDownloadPack = async () => {
    if (status !== 'IDLE') return;
    if (!navigator.onLine) {
      alert('Connection required for tactical hardening.');
      return;
    }

    setStatus('SYNCING');
    setProgress(10);

    try {
      // 1. Save Metadata to DB
      await savePack({ ...pack, offlineReady: true, downloadedAt: new Date().toISOString() });

      // 2. Prepare the Asset Manifest (Crucial for A2HS success)
      const scripts = Array.from(document.scripts)
        .filter(s => s.src.includes('_next/static'))
        .map(s => s.src);
      
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(s => (s as HTMLLinkElement).href);

      const registration = await navigator.serviceWorker.ready;
      
      // 3. Trigger the Centralized SW Sync Engine
      registration.active?.postMessage({
        type: 'START_OFFLINE_SYNC',
        payload: {
          citySlug,
          // We cache the A2HS entry point explicitly
          assets: [
            window.location.pathname,
            `${window.location.pathname}?source=a2hs`,
            `/api/manifest/${citySlug}`,
            `/api/pack?city=${encodeURIComponent(pack.city)}`,
            `/icons/${citySlug}-192.png`,
            `/icons/${citySlug}-512.png`,
            ...scripts,
            ...styles
          ]
        }
      });
    } catch (err) {
      console.error('Download Failed:', err);
      setStatus('IDLE');
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-white text-sm font-black uppercase tracking-widest">Tactical Download</h4>
          <p className="text-slate-500 text-[10px] mt-1">Prepare sandbox for offline flight</p>
        </div>
        {status === 'SUCCESS' && (
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            SECURED
          </span>
        )}
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
        <div 
          className="bg-emerald-500 h-full transition-all duration-500" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <button 
        onClick={handleDownloadPack}
        disabled={status !== 'IDLE'}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          status === 'SUCCESS' 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "bg-white text-slate-900 hover:bg-slate-100"
        }`}
      >
        {status === 'SYNCING' ? `HARDENING... ${progress}%` : status === 'SUCCESS' ? '✓ PACK SECURED' : 'SECURE PACK OFFLINE'}
      </button>
    </div>
  );
}