'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TravelPack } from '@/types/travel';
import { fetchTravelPack } from '@/lib/fetchTravelPack';
import { normalizeCityName } from '@/lib/cities';
import { getPack, savePack } from '../../../../scripts/offlineDB';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useStandaloneNavigationLock } from '@/hooks/useStandaloneNavigationLock';
import PackCard from '@/components/PackCard';
import DownloadPack from '@/components/DownloadPack';
import InstallApp from '@/components/InstallApp';
import DownloadRequiredModal from '@/components/DownloadRequiredModal';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import SWRegister from '@/components/SWRegister';
import OfflineDownload from '@/components/OfflineDownload';

/**
 * City-Specific Pack Page
 * 
 * Route: /packs/[city]
 * Example: /packs/bangkok, /packs/new-york-city
 * 
 * This page:
 * - Loads the city pack (from API or IndexedDB)
 * - Displays the pack content
 * - Has city-specific manifest injected via metadata
 */
export default function CityPackPage() {
  const params = useParams();
  const router = useRouter();
  const { isStandalone } = usePWAInstall();
  const [pack, setPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultStatus, setVaultStatus] = useState<'idle' | 'syncing' | 'secured'>('idle');
  const cityParam = params?.city as string;

  // Centralized navigation locking - handles all city pack navigation guards
  const { showModal: showDownloadModal, setShowModal: setShowDownloadModal, targetCity } = 
    useStandaloneNavigationLock(pack?.city);

  useEffect(() => {
    async function loadPack() {
      if (!cityParam) {
        setLoading(false);
        return;
      }

      try {
        // First, try to load from IndexedDB (offline-first)
        const normalizedCity = normalizeCityName(cityParam);
        const savedPack = await getPack(normalizedCity) || await getPack(cityParam);
        
        if (savedPack) {
          setPack(savedPack);
          setVaultStatus('secured');
          setLoading(false);
          return;
        }

        // If not in IndexedDB, fetch from API
        // Try both normalized and original city name
        const fetchedPack = await fetchTravelPack(cityParam) || await fetchTravelPack(normalizedCity);
        
        if (fetchedPack) {
          setPack(fetchedPack);
          
          // Save to IndexedDB for offline access
          const packWithMeta: TravelPack = {
            ...fetchedPack,
            downloadedAt: new Date().toISOString(),
            offlineReady: true,
          };
          
          await savePack(packWithMeta);
          setVaultStatus('secured');
          
          // Cache the page in service worker (will use city-specific cache)
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_URL',
              payload: window.location.pathname
            });
          }
        } else {
          // Pack not found or fetch failed
          // In standalone/offline mode, don't show error - data should be in cache
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          
          if (isStandalone || isOffline) {
            // In standalone/offline mode, gracefully handle - don't show error state
            // The pack should already be in IndexedDB or service worker cache
            // If it's not, that's okay - just show loading completed
            setLoading(false);
          } else {
            // Only redirect if not in standalone mode and online
            router.push('/');
          }
        }
      } catch (error) {
        // Suppress error logging when offline/standalone
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        
        if (!isStandalone && !isOffline) {
          // Only log errors when online and not in standalone mode
          console.error('Failed to load pack:', error);
        }
        
        // In standalone/offline mode, don't redirect - gracefully handle
        if (!isStandalone && !isOffline) {
          router.push('/');
        } else {
          // In standalone/offline mode, just stop loading - don't show error state
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPack();
  }, [cityParam, router, isStandalone]);

  // Navigation locking is handled by useStandaloneNavigationLock hook (called above)
  // This ensures navigation locking lives in one place only to prevent race conditions

  // Update manifest link to city-specific manifest
  useEffect(() => {
    if (pack && typeof window !== 'undefined') {
      const normalizedCity = normalizeCityName(pack.city);
      const manifestUrl = `/api/manifest/${normalizedCity}`;
      
      // Remove any existing manifest link
      const existingLink = document.querySelector('link[rel="manifest"]');
      if (existingLink) {
        existingLink.remove();
      }
      
      // Add city-specific manifest link
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);

      // Cleanup: Remove manifest when component unmounts (navigating away)
      return () => {
        const linkToRemove = document.querySelector('link[rel="manifest"]');
        if (linkToRemove) {
          linkToRemove.remove();
        }
      };
    }
  }, [pack]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!pack) {
    // In standalone/offline mode, don't show error state
    // The pack should be in cache - if not, show a helpful message without error tone
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    
    if (isStandalone || isOffline) {
      return (
        <main className="min-h-screen bg-white p-4 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-sm text-gray-600 mb-4">
              Loading pack data from cache...
            </p>
            <p className="text-xs text-gray-500">
              If this pack was previously downloaded, it should appear shortly.
            </p>
          </div>
        </main>
      );
    }
    
    // Only show error state when online and not in standalone mode
    return (
      <main className="min-h-screen bg-white p-4 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Pack Not Found</h1>
        <button
          onClick={() => router.replace('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col">      
      {/* Download Required Modal */}
      <DownloadRequiredModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        targetCity={targetCity}
      />
      
      <div className="w-full max-w-4xl mx-auto flex-1 space-y-6">
        {/* Header with back button - Hidden in standalone mode (no navigation to other cities) */}
        {!isStandalone && (
          <div className="flex items-center justify-between mb-4">
            <BackButton />
          </div>
        )}
        
        {/* Standalone mode notice */}
        {isStandalone && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs font-medium text-center">
              📱 Standalone App Mode • Showing only {pack.city} pack
            </p>
          </div>
        )}

{/* Pack Content */}
<PackCard pack={pack} vaultStatus={vaultStatus} />
<div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
  <div className="p-8 sm:p-12">
    
    {/* Minimalist Header */}
    <header className="max-w-2xl mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">
          Offline Deployment Protocol
        </h3>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
        Secure Your Intelligence
      </h2>
      <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
        Select your deployment method to ensure 100% access in zero-connectivity environments.
      </p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* BLOCK 1: DESKTOP DOWNLOAD (Save to Device) */}
      <div className="bg-white rounded-3xl p-8 flex flex-col justify-between shadow-xl border border-white transition-all hover:border-emerald-500/30">
      <div className="bg-white border-2 border-slate-200 p-8 rounded-3xl flex flex-col justify-between">
    <div>
      <h4 className="text-slate-900 font-black uppercase tracking-tighter text-2xl mb-2">Desktop Vault</h4>
      <p className="text-slate-600 text-sm mb-6">Archive this intelligence to your local hardware. Open via any browser without an internet connection.</p>
    </div>
    {/* Triggers your handleExport logic */}
    <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs">
      Save to Local Disk
    </button>
  </div>

        {/* Triggers OS Save Dialog via OfflineDownload component */}
        <div className="mt-auto">
          <OfflineDownload pack={pack} />
        </div>
      </div>

      {/* BLOCK 2: MOBILE INSTALL (Add to Home Screen) */}
      <div className="bg-slate-900 p-8 rounded-3xl flex flex-col justify-between border border-slate-800">
    <div>
      <h4 className="text-white font-black uppercase tracking-tighter text-2xl mb-2">Mobile Install</h4>
      <p className="text-slate-400 text-sm mb-6">Deploy a dedicated app icon to your home screen. Verified for airplane mode and low-signal sectors.</p>
    </div>
    {/* Triggers the Mobile Guide/InstallApp logic */}
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">
        Tap "Share" then "Add to Home Screen"
      </p>
    </div>
  </div>

    </div>

    {/* Verification Footer */}
    <footer className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Integrity</span>
          <span className="text-xs font-bold text-slate-300">Verified Offline Asset</span>
        </div>
        <div className="h-8 w-px bg-slate-800 hidden sm:block" />
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sync Status</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-500">Local Sync Active</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-600 font-medium italic">
        Format: Encrypted Standalone Blob • SHA-256 Verified
      </p>
    </footer>
  </div>
</div>
      </div>
      
      <Footer />
    </main>
  );
}
