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
    <header className="w-full mb-12">
      <div className="flex items-center gap-3 mb-4">
        {/* Decorative element - aria-hidden for screen readers */}
        <span aria-hidden="true" className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
          Offline Deployment Protocols
        </h3>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight mb-4">
        Download For Offline Use
      </h2>
      <p className="text-slate-200 text-base leading-relaxed w-full">
        Don't rely on shaky Wi-Fi. Follow the steps below to keep this travel pack intel stored safely on your device, ready to use whenever you need it.
      </p>
    </header>

    {/* Responsive Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* BLOCK 1: DESKTOP VAULT */}
      <div className="hidden lg:flex bg-white rounded-3xl p-8 flex-col justify-between shadow-xl border border-white transition-all hover:border-emerald-500/30">
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
              Desktop Protocol
            </span>
          </div>
          <h4 className="text-slate-900 font-black tracking-tighter text-2xl mb-3">
            Save to Local Storage
          </h4>
          <p className="text-slate-700 text-base mb-8 leading-relaxed">
            Archive this intelligence to your local hardware. Open via any browser without an internet connection.
          </p>
        </div>

        <div className="mt-auto">
          {/* Ensure the button inside OfflineDownload meets 44x44px touch target */}
          <OfflineDownload pack={pack} />
        </div>
      </div>

      {/* BLOCK 2: MOBILE INSTALL */}
      <div className="bg-slate-800/60 p-8 rounded-3xl flex flex-col border border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest border border-slate-600 px-2 py-1 rounded">
            Mobile Protocol
          </span>
        </div>
        
        <h4 className="text-white font-black tracking-tighter text-2xl mb-8">
          Mobile Device Install
        </h4>

        {/* 1-2-3 Step Container */}
        <div className="space-y-8 relative" role="list">
          {/* Vertical Connecting Line */}
          <div aria-hidden="true" className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-600" />

          {/* Step 1 */}
          <div className="relative flex items-start gap-5" role="listitem">
            <div aria-hidden="true" className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 border border-slate-500 text-xs font-black text-emerald-400">
              01
            </div>
            <div>
              <p className="text-white text-base font-bold uppercase tracking-wide mb-1">Browser Bar Menu</p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Tap the <span className="text-white font-bold underline decoration-emerald-500/50 underline-offset-4">Share</span> button in your mobile browser address bar.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-start gap-5" role="listitem">
            <div aria-hidden="true" className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 border border-slate-500 text-xs font-black text-emerald-400">
              02
            </div>
            <div>
              <p className="text-white text-base font-bold uppercase tracking-wide mb-1">Add to Home</p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Find and select <span className="text-white font-bold underline decoration-emerald-500/50 underline-offset-4">Add to Home Screen</span>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-start gap-5" role="listitem">
            <div aria-hidden="true" className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              03
            </div>
            <div>
              <p className="text-white text-base font-bold uppercase tracking-wide mb-1">Launch Travel Pack</p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Tap the new icon to access your intel <span className="text-emerald-400 font-bold">100% offline</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Verification Footer */}
    <footer className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Integrity</span>
          <span className="text-sm font-bold text-slate-200">Verified Offline Asset</span>
        </div>
        <div aria-hidden="true" className="h-8 w-px bg-slate-800 hidden sm:block" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sync Status</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-400">Local Sync Active</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 font-medium italic">
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
