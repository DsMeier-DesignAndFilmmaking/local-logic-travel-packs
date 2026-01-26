'use client';

import { useState, useEffect, useRef } from 'react';
import CityInput from '@/components/CityInput';
import { TravelPack } from '@/lib/travelPacks';
import { preloadAllPacksBackground } from '@/lib/preloadPacks';
import { SupportedCity } from '@/lib/cities';

import TravelPackDownload from '@/components/TravelPackDownload';
import Tier1Download from '@/components/Tier1Download';
import PremiumUnlock from '@/components/PremiumUnlock';
import ProblemFirstNavigation from '@/components/ProblemFirstNavigation';
import OfflineSearch from '@/components/OfflineSearch';
import Spontaneity from '@/components/Spontaneity';

import Link from 'next/link';
import { getPack, savePack, getAllPacks } from '../../scripts/offlineDB';

function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('🛡️ Service Worker active'))
          .catch((err) => console.error('❌ SW registration failed:', err));
      });
    }
  }, []);
  return null;
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<SupportedCity | null>(null);
  const [pack, setPack] = useState<TravelPack | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to prevent UI flicker
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 1. HARDENED RECOVERY LOGIC
  useEffect(() => {
    preloadAllPacksBackground();
    
    const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    setIsStandalone(isSA);
    setIsOffline(!navigator.onLine);

    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const recoverVault = async () => {
      try {
        const localPacks = await getAllPacks();
        
        if (localPacks && localPacks.length > 0) {
          // Sort by most recent download
          const latest = localPacks.sort((a, b) => 
            new Date(b.downloadedAt || 0).getTime() - new Date(a.downloadedAt || 0).getTime()
          )[0];

          setActiveSession(latest.city);

          // If in App Mode, inject the pack data directly to bypass the fetch effect
          if (isSA) {
            console.log("🛠️ PWA Recovery: Forcing hydration for", latest.city);
            setPack(latest);
            setSelectedCity(latest.city as SupportedCity);
          }
        }
      } catch (err) {
        console.warn("Vault recovery failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    recoverVault();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // 2. DATA HYDRATION (Used mainly for Web/New Selections)
  useEffect(() => {
    // If we already have the pack (from recovery), don't fetch again
    if (!selectedCity || pack?.city === selectedCity) return;

    const loadPack = async () => {
      setIsLoading(true);
      try {
        const offlinePack = await getPack(selectedCity);
        if (offlinePack) {
          setPack(offlinePack);
        } else if (navigator.onLine) {
          const res = await fetch(`/api/travel-packs?city=${encodeURIComponent(selectedCity)}`);
          if (res.ok) {
            const travelPack = await res.json();
            setPack(travelPack);
            // Save with timestamp for the recovery logic
            await savePack({ ...travelPack, downloadedAt: new Date().toISOString() });
          }
        }
      } catch (err) {
        console.error('Vault load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPack();
  }, [selectedCity, pack]);

  // UI STATE HELPERS
  const isVaultActive = !!pack && !isLoading;
  const showLandingPage = !isVaultActive && !isLoading;

  return (
    <div className="min-h-screen bg-white">
      <SWRegister />
      <main className="container mx-auto px-5 py-12 max-w-4xl">
        
        {/* A. LANDING HEADER */}
        {showLandingPage && (
          <div className="text-center mb-12 animate-in fade-in duration-500">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Local Logic <span className="text-blue-600">Vault</span>
            </h1>
          </div>
        )}

        {/* B. RESUME SESSION CARD */}
        {showLandingPage && activeSession && (
          <div className="mb-10 p-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[34px] shadow-lg">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Tactical Asset Ready</p>
                  <h3 className="text-xl font-bold">Resume {activeSession} Session</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCity(activeSession as SupportedCity)}
                className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                Open Vault
              </button>
            </div>
          </div>
        )}
  
        {/* C. SEARCH (Only Online & Not in a pack) */}
        {showLandingPage && !isStandalone && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Select Destination</h2>
            <CityInput
              value={selectedCity ?? ''}
              onChange={(value) => setSelectedCity(value as SupportedCity)}
              onPackSelect={setSelectedCity}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Accessing Secure Vault</p>
          </div>
        )}
  
        {/* D. THE VAULT (The Tactical UI) */}
        {isVaultActive && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 mb-12">
            {!isOffline && (
              <button 
                onClick={() => { setPack(null); setSelectedCity(null); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-2 transition-colors"
              >
                ← Exit Vault
              </button>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pack.city}, {pack.country}</h2>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">Verified Offline Asset</p>
                  </div>
                  {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                </div>
              </div>
  
              {pack?.tiers?.tier1 && <OfflineSearch cityName={pack.city as SupportedCity} onResultClick={() => {}} />}
              {pack.tiers?.tier1 && <ProblemFirstNavigation pack={pack} />}
              
              <div className="mt-6 pt-6 border-t border-slate-100 pb-6">
                <TravelPackDownload pack={pack} />
              </div>
            </div>
          </div>
        )}
  
        {/* E. SPONTANEITY (Landing Page only) */}
        {showLandingPage && (
          <div className="animate-in fade-in duration-700">
            <Spontaneity pack={pack} />
          </div>
        )}
  
      </main>

      {!isStandalone && (
        <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16">
          <div className="container mx-auto max-w-4xl px-6 sm:px-10 flex flex-col items-center gap-6">
            <div className="flex gap-8">
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Terms</Link>
            </div>
            <p className="text-[12px] text-slate-400 font-medium">© {new Date().getFullYear()} Dan Meier.</p>
          </div>
        </footer>
      )}
    </div>
  );
}