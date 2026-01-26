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
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 1. ENVIRONMENT & AUTO-LOAD LOGIC
  useEffect(() => {
    preloadAllPacksBackground();
    
    const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    setIsStandalone(isSA);
    setIsOffline(!navigator.onLine);

    const checkActiveSession = async () => {
      try {
        const localPacks = await getAllPacks();
        if (localPacks && localPacks.length > 0) {
          // Get the most recent pack saved
          const latest = localPacks[localPacks.length - 1];
          setActiveSession(latest.city);

          // If launched as App, force-select the city immediately
          if (isSA) {
            console.log(`🚀 Standalone detected. Auto-engaging Vault: ${latest.city}`);
            setSelectedCity(latest.city as SupportedCity);
          }
        }
      } catch (err) {
        console.warn("Vault retrieval failed", err);
      }
    };
    checkActiveSession();
  }, []);

  // 2. DATA HYDRATION EFFECT
  useEffect(() => {
    if (!selectedCity) return;

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
            await savePack(travelPack);
          }
        }
      } catch (err) {
        console.error('Vault load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPack();
  }, [selectedCity]);

  // UI STATE HELPERS
  const isVaultActive = !!pack;
  const showLandingPage = !isVaultActive && !selectedCity && !isLoading;

  return (
    <div className="min-h-screen bg-white">
      <SWRegister />
      <main className="container mx-auto px-5 py-12 max-w-4xl">
        
        {/* A. LANDING HEADER (Only if no pack) */}
        {showLandingPage && (
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Local Logic <span className="text-blue-600">Vault</span>
            </h1>
          </div>
        )}

        {/* B. RESUME CARD (Only on Landing Page) */}
        {showLandingPage && activeSession && (
          <div className="mb-10 p-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[34px] shadow-lg">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Vault Detected</p>
                  <h3 className="text-xl font-bold">Resume {activeSession} Session</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCity(activeSession as SupportedCity)}
                className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase"
              >
                Open Vault
              </button>
            </div>
          </div>
        )}
  
        {/* C. SEARCH (Only if no pack and not Standalone) */}
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

        {isLoading && <div className="text-center p-20 animate-pulse text-slate-400 font-bold">Accessing Secure Storage...</div>}
  
        {/* D. THE VAULT (Travel Pack Results) */}
        {isVaultActive && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 mb-12">
            {!isOffline && (
              <button 
                onClick={() => { setPack(null); setSelectedCity(null); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-2"
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
  
        {/* E. SPONTANEITY (Only if no pack is loaded) */}
        {!isVaultActive && (
          <Spontaneity pack={pack} />
        )}
  
      </main>

      {!isStandalone && (
        <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16 text-center">
            <p className="text-[12px] text-slate-400 font-medium">© {new Date().getFullYear()} Dan Meier.</p>
        </footer>
      )}
    </div>
  );
}