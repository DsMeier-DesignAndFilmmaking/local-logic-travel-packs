'use client';

import { useState, useEffect, useCallback } from 'react';
import CityInput from '@/components/CityInput';
import { TravelPack } from '@/lib/travelPacks';
import { preloadAllPacksBackground } from '@/lib/preloadPacks';
import { SupportedCity } from '@/lib/cities';

import TravelPackDownload from '@/components/TravelPackDownload';
import Tier1Download from '@/components/Tier1Download';
import ProblemFirstNavigation from '@/components/ProblemFirstNavigation';
import OfflineSearch from '@/components/OfflineSearch';
import Spontaneity from '@/components/Spontaneity';
import SWRegister from '@/components/SWRegister'; // Using the component we fixed earlier

import Link from 'next/link';
import { getPack, savePack, getAllPacks } from '../../scripts/offlineDB';

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<SupportedCity | null>(null);
  const [pack, setPack] = useState<TravelPack | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  /**
   * 1. RECOVERY & ENVIRONMENT INITIALIZATION
   */
  useEffect(() => {
    preloadAllPacksBackground();
    
    const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    
    setIsStandalone(isSA);
    setIsOffline(!navigator.onLine);

    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const initVault = async () => {
      try {
        const localPacks = await getAllPacks();
        
        if (localPacks && localPacks.length > 0) {
          // The helper in offlineDB.ts now handles sorting, 
          // but we'll double-check here for safety.
          const latest = localPacks[0]; 
          setActiveSession(latest.city);

          // If running as a PWA, we assume the user wants their last open vault immediately.
          if (isSA) {
            console.log("🛠️ PWA Auto-Hydration:", latest.city);
            setPack(latest as any);
            setSelectedCity(latest.city as SupportedCity);
          }
        }
      } catch (err) {
        console.warn("Vault initialization failed:", err);
      } finally {
        // We only stop loading once we've checked the DB
        setIsLoading(false);
      }
    };
    
    initVault();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  /**
   * 2. DATA HYDRATION LOGIC
   * Refactored to prevent infinite loops and handle state updates cleanly.
   */
  const loadCityVault = useCallback(async (city: SupportedCity) => {
    if (pack?.city === city) return;
    
    setIsLoading(true);
    try {
      // Priority 1: Check Local Storage
      const offlinePack = await getPack(city);
      
      if (offlinePack) {
        setPack(offlinePack as any);
        // Refresh timestamp so this city stays "at the top"
        await savePack({ ...offlinePack, downloadedAt: new Date().toISOString() });
      } 
      // Priority 2: Fetch from API if online
      else if (navigator.onLine) {
        const res = await fetch(`/api/travel-packs?city=${encodeURIComponent(city)}`);
        if (res.ok) {
          const travelPack = await res.json();
          setPack(travelPack);
          // Vital: Save with timestamp for next recovery
          await savePack({ ...travelPack, downloadedAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      console.error('Vault load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pack?.city]);

  // Trigger load when selectedCity changes (usually via Search or Resume button)
  useEffect(() => {
    if (selectedCity) {
      loadCityVault(selectedCity);
    }
  }, [selectedCity, loadCityVault]);

  /**
   * 3. UI STATE CALCULATIONS
   */
  const isVaultActive = !!pack && !isLoading;
  // We explicitly wait for isLoading to be false to avoid the Spontaneity flash
  const showLandingPage = !isVaultActive && !isLoading;

  return (
    <div className="min-h-screen bg-white">
      <SWRegister />
      
      <main className="container mx-auto px-5 py-12 max-w-4xl">
        
        {/* LANDING HEADER */}
        {showLandingPage && (
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Local Logic <span className="text-blue-600">Vault</span>
            </h1>
            <p className="mt-4 text-slate-500 font-medium tracking-tight uppercase text-[10px]">
              Tactical travel intelligence • Offline by default
            </p>
          </div>
        )}

        {/* RESUME SESSION CARD */}
        {showLandingPage && activeSession && (
          <div className="mb-10 p-1 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600 rounded-[34px] shadow-xl animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Last Deployment Found</p>
                  <h3 className="text-xl font-bold tracking-tight">Resume {activeSession} Session</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCity(activeSession as SupportedCity)}
                className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                Open Vault
              </button>
            </div>
          </div>
        )}
  
        {/* SEARCH INTERFACE */}
        {showLandingPage && !isStandalone && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Initiate New Session</h2>
            <CityInput
              value={selectedCity ?? ''}
              onChange={(value) => setSelectedCity(value as SupportedCity)}
              onPackSelect={setSelectedCity}
            />
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Decrypting Tactical Data</p>
          </div>
        )}
  
        {/* THE VAULT UI */}
        {isVaultActive && pack && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6 mb-12">
            {!isStandalone && (
              <button 
                onClick={() => { setPack(null); setSelectedCity(null); }}
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-4 transition-all"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Exit Vault
              </button>
            )}

            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
              {/* Vault Header */}
              <div className="bg-slate-900 p-8 sm:p-12 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <div className="w-24 h-24 border-4 border-white rounded-full" />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">{pack.city}</h2>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
                            Verified Offline Asset
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{pack.country}</span>
                    </div>
                  </div>
                  {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                </div>
              </div>
  
              {/* Vault Content Modules */}
              <div className="p-2">
                {pack?.tiers?.tier1 && <OfflineSearch cityName={pack.city as SupportedCity} onResultClick={() => {}} />}
                {pack.tiers?.tier1 && <ProblemFirstNavigation pack={pack} />}
                
                <div className="mt-2 p-6 bg-slate-50 rounded-[32px]">
                  <TravelPackDownload pack={pack} />
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* SPONTANEITY COMPONENT */}
        {showLandingPage && (
          <div className="animate-in fade-in duration-1000 delay-300">
            <Spontaneity pack={pack} />
          </div>
        )}
  
      </main>

      {!isStandalone && (
        <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16">
          <div className="container mx-auto max-w-4xl px-10 flex flex-col items-center gap-6">
            <div className="flex gap-10">
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Terms</Link>
            </div>
            <p className="text-[12px] text-slate-400 font-medium tracking-tight">© {new Date().getFullYear()} Dan Meier • Built for the PWA Standard.</p>
          </div>
        </footer>
      )}
    </div>
  );
}