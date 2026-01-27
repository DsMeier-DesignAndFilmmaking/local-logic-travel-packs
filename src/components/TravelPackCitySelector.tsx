'use client';

import React, { useState, useEffect } from 'react';
import { fetchTravelPack } from '@/lib/fetchTravelPack'; 
import { TravelPack } from '@/types/travel';
import { savePack } from '../../scripts/offlineDB';
import PackCard from '@/components/PackCard';
import OfflineDownload from '@/components/OfflineDownload';
import Spontaneity from '@/components/Spontaneity';

const TravelPackCitySelector: React.FC<{ initialPack?: TravelPack | null }> = ({ initialPack }) => {
  const [travelPack, setTravelPack] = useState<TravelPack | null>(initialPack || null);
  const [loading, setLoading] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<'idle' | 'syncing' | 'secured'>('idle');

  // Sync if a pack is recovered from the offline vault on launch
  useEffect(() => {
    if (initialPack) setTravelPack(initialPack);
  }, [initialPack]);

  const handleSelect = async (selectedCity: string) => {
    setLoading(true);
    setVaultStatus('syncing');
    
    try {
      // Fetch via our API bridge (Safe from 'fs' build errors)
      const pack = await fetchTravelPack(selectedCity);
      if (pack) {
        setTravelPack(pack);
        
        // IMMEDIATELY save to IndexedDB to prime the vault
        const packWithMeta: TravelPack = {
          ...pack,
          downloadedAt: new Date().toISOString(),
          offlineReady: true,
        };
        
        await savePack(packWithMeta);
        
        // Message Service Worker to cache the current page
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_URL',
            payload: window.location.pathname
          });
        }
        
        // Also cache the home page for fallback
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_URL',
            payload: '/'
          });
        }
        
        setVaultStatus('secured');
        
        // Broadcast sync event for page.tsx hydration
        window.dispatchEvent(new CustomEvent('vault-sync-complete', {
          detail: { city: pack.city, timestamp: packWithMeta.downloadedAt }
        }));
      }
    } catch (error) {
      console.error('Failed to load pack:', error);
      setVaultStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header logic - Mobile Optimized */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Travel Intel</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Select a destination to unlock tactical insights.</p>
        </div>
        
        {travelPack && (
          <button 
            onClick={() => setTravelPack(null)}
            className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Switch City
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 1. Show City Buttons if no pack is active */}
      {!travelPack && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Spontaneity onCitySelect={handleSelect} />
        </div>
      )}

      {/* 2. Show the Pack and Download options if a pack is active */}
      {travelPack && !loading && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <PackCard pack={travelPack} vaultStatus={vaultStatus} />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-bold mb-4">Offline Access</h3>
            <OfflineDownload pack={travelPack} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPackCitySelector;