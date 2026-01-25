'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB'; // Ensure getPack exists to check status

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
  // States: idle (not saved), syncing (processing), saved (exists in DB)
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');

  // On mount, check if this specific city is already saved in IndexedDB
  useEffect(() => {
    async function checkExisting() {
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) {
        console.error('Error checking IndexedDB:', err);
      }
    }
    checkExisting();
  }, [pack.city]);

  const handleSync = async () => {
    setStatus('syncing');

    // Create the structured data object
    const downloadData = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: pack.tiers,
    };

    try {
      // 1. Save to IndexedDB (The "Native" Storage)
      await savePack(downloadData);
      
      // 2. Artificial delay (optional): Research shows a 500ms-800ms "sync" animation 
      // makes the user feel like the data is "heavier" and more reliable.
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStatus('saved');
      console.log(`Offline pack for ${pack.city} locked into local storage.`);
    } catch (err) {
      console.error('Failed to save offline pack:', err);
      setStatus('idle');
      alert('Local storage full or restricted. Please check browser settings.');
    }
  };

  // UI Configuration based on status
  const config = {
    idle: {
      text: "Download for Offline Use",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      styles: "bg-transparent text-slate-900 border border-slate-200 hover:bg-slate-50"
    },
    syncing: {
      text: "Syncing Tactical Logic...",
      icon: (
        <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      styles: "bg-slate-50 text-blue-600 border border-blue-100 animate-pulse cursor-wait"
    },
    saved: {
      text: "Available Offline",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      styles: "bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default"
    }
  };

  const current = config[status];

  return (
    <div className="w-full space-y-3">
      <button
        onClick={handleSync}
        disabled={status !== 'idle'}
        className={`w-full px-6 py-4 rounded-2xl focus:outline-none transition-all font-bold flex items-center justify-center gap-3 active:scale-[0.98] touch-manipulation ${current.styles}`}
      >
        {current.icon}
        {current.text}
      </button>

      {status === 'saved' && (
        <p className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-widest animate-fadeIn">
          Saved to local vault • No signal required
        </p>
      )}
    </div>
  );
}