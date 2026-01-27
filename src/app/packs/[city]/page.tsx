'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TravelPack } from '@/types/travel';
import { fetchTravelPack } from '@/lib/fetchTravelPack';
import { normalizeCityName } from '@/lib/cities';
import { getPack, savePack } from '../../../../scripts/offlineDB';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PackCard from '@/components/PackCard';
import DownloadPack from '@/components/DownloadPack';
import InstallApp from '@/components/InstallApp';
import DownloadRequiredModal from '@/components/DownloadRequiredModal';
import Footer from '@/components/Footer';
import CitySWRegister from '@/components/CitySWRegister';

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [targetCity, setTargetCity] = useState<string | undefined>();

  const cityParam = params?.city as string;

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
          // Pack not found - only redirect if not in standalone mode
          if (!isStandalone) {
            router.push('/');
          } else {
            // In standalone mode, show error but don't navigate away
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load pack:', error);
        // Only redirect if not in standalone mode
        if (!isStandalone) {
          router.push('/');
        } else {
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPack();
  }, [cityParam, router, isStandalone]);

  // Lock navigation in standalone mode - check if trying to access different city
  useEffect(() => {
    if (!isStandalone || !pack || !cityParam) return;

    const currentNormalizedCity = normalizeCityName(pack.city);
    const pathNormalizedCity = normalizeCityName(cityParam);
    
    // If path city doesn't match current pack city, show modal
    if (pathNormalizedCity !== currentNormalizedCity) {
      setTargetCity(cityParam);
      setShowDownloadModal(true);
      
      // Redirect back to current city's pack page
      router.replace(`/packs/${currentNormalizedCity}`);
    }
  }, [isStandalone, pack, cityParam, router]);

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
    return (
      <main className="min-h-screen bg-white p-4 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Pack Not Found</h1>
        {!isStandalone && (
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        )}
        {isStandalone && (
          <p className="text-sm text-gray-600 text-center">
            This pack is not available. Please check your connection and try again.
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col">
      {/* Register city-specific service worker */}
      {pack && <CitySWRegister city={pack.city} />}
      
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
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
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
        
        {/* Download Pack Section - Separate from A2HS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold mb-4">Download Pack</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download city data, cache assets, and save to device storage. This is separate from app installation.
          </p>
          <DownloadPack pack={pack} />
        </div>

        {/* Install App Section - A2HS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-bold mb-4">Install App</h3>
          <p className="text-sm text-gray-600 mb-4">
            Install this pack as a standalone app. Shows only {pack.city}. No navigation to other cities unless online.
          </p>
          <InstallApp city={pack.city} />
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
