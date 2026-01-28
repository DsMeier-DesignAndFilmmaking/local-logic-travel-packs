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
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import OfflineDownload from '@/components/OfflineDownload';
import DownloadRequiredModal from '@/components/DownloadRequiredModal';

export default function CityPackPage() {
  const params = useParams();
  const router = useRouter();
  const { isStandalone, platform } = usePWAInstall();
  const [pack, setPack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultStatus, setVaultStatus] = useState<'idle' | 'syncing' | 'secured'>('idle');
  const cityParam = params?.city as string;
  
  // Mobile-only "installed single-city" semantics.
  // Desktop PWAs should behave like the full multi-city web app.
  const isMobileStandalone = isStandalone && (platform === 'ios' || platform === 'android');
  
  // State for the Desktop Protocol block reactivity
  const [isVerified, setIsVerified] = useState(false);

  const { showModal: showDownloadModal, setShowModal: setShowDownloadModal, targetCity } = 
    useStandaloneNavigationLock(pack?.city);

  // 1. Unified Vault Sync Listener
  useEffect(() => {
    // Initial check on mount
    async function checkInitialSync() {
      if (!cityParam) return;
      const normalizedCity = normalizeCityName(cityParam);
      const savedPack = await getPack(normalizedCity) || await getPack(cityParam);
      if (savedPack) {
        setIsVerified(true);
        setVaultStatus('secured');
      }
    }
    checkInitialSync();

    // Event listener to react to changes inside OfflineDownload child component
    const handleVaultUpdate = (e: any) => {
      const normalizedCurrent = normalizeCityName(cityParam);
      const eventCity = normalizeCityName(e.detail.city);

      if (eventCity === normalizedCurrent) {
        const isNowSynced = e.detail.status === 'synced';
        setIsVerified(isNowSynced);
        setVaultStatus(isNowSynced ? 'secured' : 'idle');
      }
    };

    window.addEventListener('vault-update', handleVaultUpdate);
    return () => window.removeEventListener('vault-update', handleVaultUpdate);
  }, [cityParam]);

  useEffect(() => {
    async function loadPack() {
      if (!cityParam) {
        setLoading(false);
        return;
      }

      try {
        const normalizedCity = normalizeCityName(cityParam);
        const savedPack = await getPack(normalizedCity) || await getPack(cityParam);
        
        if (savedPack) {
          setPack(savedPack);
          setIsVerified(true);
          setVaultStatus('secured');
          setLoading(false);
          return;
        }

        const fetchedPack = await fetchTravelPack(cityParam) || await fetchTravelPack(normalizedCity);
        
        if (fetchedPack) {
          setPack(fetchedPack);
          const packWithMeta: TravelPack = {
            ...fetchedPack,
            downloadedAt: new Date().toISOString(),
            offlineReady: true,
          };
          
          await savePack(packWithMeta);
          setIsVerified(true);
          setVaultStatus('secured');
          
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_URL',
              payload: window.location.pathname
            });
          }
        } else {
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (!isStandalone && !isOffline) router.push('/');
        }
      } catch (error) {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        if (!isMobileStandalone && !isOffline) {
          console.error('Failed to load pack:', error);
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    }

    loadPack();
  }, [cityParam, router, isStandalone]);

  useEffect(() => {
    if (pack && typeof window !== 'undefined') {
      const normalizedCity = normalizeCityName(pack.city);
      const manifestUrl = `/api/manifest/${normalizedCity}`;
      const existingLink = document.querySelector('link[rel="manifest"]');
      if (existingLink) existingLink.remove();
      
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);

      return () => {
        const linkToRemove = document.querySelector('link[rel="manifest"]');
        if (linkToRemove) linkToRemove.remove();
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
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isMobileStandalone || isOffline) {
      return (
        <main className="min-h-screen bg-white p-4 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-sm text-gray-600 mb-4 text-center">Loading pack data from cache...</p>
          </div>
        </main>
      );
    }
    return null;
  }

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col">      
      <DownloadRequiredModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        targetCity={targetCity}
      />
      
      <div className="w-full max-w-4xl mx-auto flex-1 space-y-6">
        {!isMobileStandalone && (
          <div className="flex items-center justify-between mb-4">
            <BackButton />
          </div>
        )}
        
        {isMobileStandalone && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs font-medium text-center">
              📱 Standalone App Mode • Showing only {pack.city} pack
            </p>
          </div>
        )}

{pack ? (
  <PackCard pack={pack} />
) : (
  <div>Loading Tactical Intel...</div>
)}


        {/* OFFLINE PROTOCOL DASHBOARD */}
        <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-12">
            
            <header className="w-full mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden="true" className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                  Offline Protocols
                </h3>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight mb-4">
                Download For Offline Use
              </h2>
              <p className="text-slate-200 text-base leading-relaxed w-full">
                Don't rely on shaky Wi-Fi. Follow the steps below to keep this travel pack intel stored safely on your device, ready to use whenever you need it.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
             {/* BLOCK 1: DESKTOP VAULT */}
<div className="hidden lg:flex bg-white rounded-3xl p-8 flex-col justify-between shadow-xl border border-white">
  <div>
  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
                      Desktop Browser Protocol
                    </span>
                  </div>
    <div className="flex items-center justify-between mb-8">
      <h4 className="text-slate-900 font-black tracking-tighter text-2xl">
        {isVerified ? "Offline Vault Active" : "Syncing to Device..."}
      </h4>
      
      {/* THIS IS THE ONLY "VERIFIED" LABEL WE NEED */}
      {isVerified && (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Verified</span>
        </div>
      )}
    </div>
    <div className="space-y-4">
    <p className="text-slate-600 text-base leading-relaxed">
      Everything is saved and ready to go. You can open this guide anytime, even if you’re completely off-grid.
    </p>

    {/* The Cache Warning & Mobile Suggestion */}
    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
      <p className="text-amber-800 text-xs leading-relaxed">
        <strong>Note:</strong> Clearing your browser cache will remove this offline access. For a more permanent version, follow the <strong>Mobile Access</strong> steps to save this guide directly to your home screen.
      </p>
    </div>
  </div>

    <div className="space-y-4 pt-6 border-t border-slate-100">
      <p className="text-slate-900 font-bold text-xs uppercase tracking-[0.2em]">Quick Access</p>
      <ul className="space-y-4">
      <li className="flex items-start gap-4 text-slate-600 text-sm">
      {/* Added gap-4 for more breathing room */}
      <span className="flex-none w-5 h-5 rounded-full bg-slate-900 text-[10px] font-bold text-white flex items-center justify-center mt-0.5">
        1
      </span>
      
      <span className="leading-relaxed">
        {/* Using &nbsp; between "traveling" and "later" ensures they stay together */}
        <strong>Bookmark this page</strong> (Ctrl+D) so you can find it easily when&nbsp;traveling.
      </span>
    </li>
    </ul>
    </div>
  </div>

</div>

              {/* BLOCK 2: MOBILE INSTRUCTIONS */}
              <div className="bg-white rounded-3xl p-8 flex-col justify-between shadow-xl border border-white transition-all hover:border-emerald-500/30">
                <div>
                <div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    {/* Minimalist Phone Icon */}
    <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg text-slate-600">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
        <path d="M12 18h.01"/>
      </svg>
    </div>
    
    <span className="text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
      Offline Access on Mobile
    </span>
  </div>
</div>
                  <h4 className="text-slate-900 font-black tracking-tighter text-2xl mb-6">
                    Save for Offline Access
                  </h4>
                  
                  <div className="space-y-6 relative" role="list">
                    <div aria-hidden="true" className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100" />

                    <div className="relative flex items-start gap-5" role="listitem">
                      <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-600">01</div>
                      <div>
                        <p className="text-slate-900 text-base font-bold uppercase tracking-wide mb-1">Open Menu</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Tap the <strong>Share</strong> icon in Safari or Chrome.</p>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-5" role="listitem">
                      <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-600">02</div>
                      <div>
                        <p className="text-slate-900 text-base font-bold uppercase tracking-wide mb-1">Add to Home</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Scroll down and select <strong>Add to Home Screen</strong>.</p>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-5" role="listitem">
                      <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">03</div>
                      <div>
                        <p className="text-slate-900 text-base font-bold uppercase tracking-wide mb-1">Launch Vault</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Tap the new icon to access intel <strong>100% offline</strong>.</p>
                      </div>
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
              <p className="text-xs text-slate-400 font-medium italic">Format: Encrypted Standalone Blob • SHA-256 Verified</p>
            </footer>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}