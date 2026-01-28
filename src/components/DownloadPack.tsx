'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';
import { normalizeCityName } from '@/lib/cities';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface DownloadPackProps {
  pack: TravelPack;
}

/**
 * Download Pack Component
 * 
 * Handles downloading city-specific data:
 * - Prefetches city data
 * - Caches assets
 * - Saves to IndexedDB
 * 
 * NOT tied to A2HS - this is just data download
 */
export default function DownloadPack({ pack }: DownloadPackProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const { isStandalone } = usePWAInstall();

  // Check if pack is already downloaded
  useEffect(() => {
    async function checkDownloaded() {
      if (!pack?.city) return;
      try {
        const existing = await getPack(pack.city);
        if (existing) {
          setIsDownloaded(true);
        }
      } catch (err) {
        console.error('DB Check Error:', err);
      }
    }
    checkDownloaded();
  }, [pack?.city]);

  const handleDownloadPack = async () => {
    if (isDownloading || isDownloaded) return;

    // Only attempt a full download when online so network/cache steps
    // don’t silently fail and leave the user in a half-synced state.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('Download requested while offline – skipping network-dependent steps.');
      alert('You need to be online to download this pack for offline use.');
      return;
    }

    setIsDownloading(true);
    setProgress(0);

    try {
      const normalizedCity = normalizeCityName(pack.city);
      
      // Step 1: Save pack to IndexedDB (20%)
      setProgress(20);
      const timestamp = new Date().toISOString();
      const packToSave: TravelPack = {
        ...pack,
        downloadedAt: timestamp,
        offlineReady: true,
      };
      await savePack(packToSave);
      
      // Step 2: Prefetch city data from API (40%)
      setProgress(40);
      const packApiUrl = `/api/pack?city=${encodeURIComponent(pack.city)}`;
      await fetch(packApiUrl, { cache: 'force-cache' });
      
      // Step 3: Cache city pack page (60%)
      setProgress(60);
      const packPageUrl = `/packs/${normalizedCity}`;
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_URL',
          payload: packPageUrl
        });
      }
      
      // Step 4: Prefetch manifest (80%)
      setProgress(80);
      const manifestUrl = `/api/manifest/${normalizedCity}`;
      await fetch(manifestUrl, { cache: 'force-cache' });
      
      // Step 5: Cache assets (icons, etc.) (100%)
      setProgress(100);
      const iconUrls = [
        `/icons/${normalizedCity}-192.png`,
        `/icons/${normalizedCity}-512.png`,
        '/travel-pack-icon-192.png',
        '/travel-pack-icon-512.png',
      ];
      
      // Try to cache city-specific icons, fallback to default
      for (const iconUrl of iconUrls) {
        try {
          await fetch(iconUrl, { cache: 'force-cache' });
        } catch (err) {
          // Icon might not exist, continue
        }
      }

      setIsDownloaded(true);
      setIsDownloading(false);
      
      // Broadcast sync event
      window.dispatchEvent(new CustomEvent('vault-sync-complete', {
        detail: { city: pack.city, timestamp }
      }));

      console.log(`✅ Pack downloaded and cached for ${pack.city}`);
    } catch (err) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      
      // Suppress alerts when offline/standalone - errors are expected
      // The service worker should handle caching, and data may already be in IndexedDB
      if (!isStandalone && !isOffline) {
        console.error('Download error:', err);
        alert('Failed to download pack. Please try again.');
      } else {
        // In offline/standalone mode, silently fail - data may already be cached
        console.log('Download failed (offline/standalone) - using cached data if available');
      }
      
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900 rounded-xl sm:rounded-3xl border border-slate-800 shadow-inner">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-white text-xs sm:text-sm font-black uppercase tracking-widest">
            Download Pack
          </h4>
          <p className="text-slate-400 text-[10px] sm:text-xs font-medium leading-relaxed mt-1">
            Prefetch data, cache assets, and save to device storage
          </p>
        </div>
        {isDownloaded && (
          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
              Downloaded
            </span>
          </div>
        )}
      </div>
      
      {isDownloading && (
        <div className="mb-4">
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-400 text-[10px] mt-2 text-center">
            {progress < 40 && 'Saving to device...'}
            {progress >= 40 && progress < 60 && 'Prefetching data...'}
            {progress >= 60 && progress < 80 && 'Caching page...'}
            {progress >= 80 && 'Caching assets...'}
          </p>
        </div>
      )}
      
      <button 
        onClick={handleDownloadPack}
        disabled={isDownloading || isDownloaded}
        className="w-full py-3 sm:py-4 min-h-[44px] bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {isDownloading ? (
          <>
            <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            DOWNLOADING...
          </>
        ) : isDownloaded ? (
          <>
            <span>✓</span>
            PACK DOWNLOADED
          </>
        ) : (
          'DOWNLOAD PACK FOR OFFLINE'
        )}
      </button>
    </div>
  );
}
