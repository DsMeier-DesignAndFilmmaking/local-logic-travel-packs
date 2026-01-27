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
        
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
  <div className="p-6 sm:p-10">
    
    <header className="mb-8 border-b border-slate-800 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">
          Offline Deployment Protocol
        </h3>
      </div>
      <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
        This intelligence pack is designed for zero-connectivity environments. Follow the protocol for your current device.
      </p>
    </header>

    {/* Viewport Conditional Logic Container - Realigned without numbers */}
    <div className="space-y-0">
      
      {/* MOBILE PROTOCOL: Visible only on small screens */}
      <section className="block md:hidden">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">
            Mobile Protocol
          </h4>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-black">
            iOS / Android
          </span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Tap the <span className="text-white font-bold">Share</span> icon then select <span className="text-white font-bold">"Add to Home Screen."</span> This deploys a dedicated, full-screen tactical interface to your device.
        </p>
        <div className="min-h-[48px]">
          <InstallApp city={pack.city} />
        </div>
      </section>

      {/* DESKTOP PROTOCOL: Visible only on medium screens and up */}
      <section className="hidden md:block">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">
            Desktop Protocol
          </h4>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-black">
            Mac / PC / Linux
          </span>
        </div>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
          Initialize the <span className="text-white font-bold">Local Sync</span> to move city intelligence from our servers to your machine's secure hardware vault. This ensures 100% offline access via your browser.
        </p>
        <div className="min-h-[48px]">
          <DownloadPack pack={pack} />
        </div>
      </section>
    </div>

    {/* Automated Detection (Desktop Only) */}
    <div className="hidden md:block mt-10 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
      <div className="flex items-start gap-4">
        <div className="text-emerald-500 mt-1 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h5 className="text-white text-xs font-bold uppercase tracking-tight mb-1">PWA Auto-Detection Active</h5>
          <p className="text-slate-400 text-xs leading-relaxed">
            Look for the <span className="text-emerald-400">"Install"</span> icon in your browser's address bar. This allows the system to launch the Travel Intel vault directly from your desktop app dock.
          </p>
        </div>
      </div>
    </div>

    {/* Verification Footer */}
    <footer className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Verified Offline Asset</span>
      <div className="flex items-center gap-4">
         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local Sync: Enabled</span>
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      </div>
    </footer>
  </div>
</div>
      </div>
      
      <Footer />
    </main>
  );
}
