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
          .then((reg) => console.log('🛡️ Service Worker active'))
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
  const [error, setError] = useState<string | null>(null);
  const [packNotFound, setPackNotFound] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  const [isOffline, setIsOffline] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. ENVIRONMENT & SESSION CHECK
  useEffect(() => {
    preloadAllPacksBackground();
    
    // Detect Standalone (PWA) Mode
    const checkStandalone = () => {
      const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true;
      setIsStandalone(isSA);
      return isSA;
    };

    const standalone = checkStandalone();
    setIsOffline(!navigator.onLine);

    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const checkActiveSession = async () => {
      try {
        const localPacks = await getAllPacks();
        if (localPacks && localPacks.length > 0) {
          const latestCity = localPacks[0].city;
          setActiveSession(latestCity);

          // FIX: If in standalone app mode, automatically load the saved city
          if (standalone) {
            setSelectedCity(latestCity as SupportedCity);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve offline sessions", err);
      }
    };
    checkActiveSession();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // 2. DATA LOADING LOGIC
  useEffect(() => {
    if (!selectedCity) return;

    const loadPack = async () => {
      setIsLoading(true);
      setError(null);
      setPackNotFound(false);

      try {
        const offlinePack = await getPack(selectedCity);

        if (offlinePack) {
          setPack({
            city: offlinePack.city,
            country: offlinePack.country,
            tiers: offlinePack.tiers, 
          });
          setIsLoading(false);
          return; 
        }

        if (!navigator.onLine) {
          setPackNotFound(true);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(selectedCity)}`);
        if (!response.ok) {
          if (response.status === 404) setPackNotFound(true);
          else setError('Failed to load travel pack');
          setPack(null);
          return;
        }

        const travelPack = await response.json();
        setPack(travelPack);

        try {
          await savePack(travelPack);
        } catch (err) {
          console.warn('Sync failed', err);
        }

      } catch (err) {
        setError('Error loading tactical data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPack();
  }, [selectedCity]);

  // 3. UI VISIBILITY LOGIC
  // We only show the city selector if we aren't already looking at a pack
  // AND we aren't in a standalone app that is already loading an active session.
  const showCitySelector = !pack && !selectedCity && !isStandalone;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <SWRegister />
      <main className="container mx-auto px-5 py-12 max-w-4xl">
        
        {/* Header: Hide when a pack is loaded in standalone to save iPhone SE screen space */}
        {(!isStandalone || !pack) && (
          <div className="text-center mb-12 animate-in fade-in duration-700">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              Local Logic <span className="text-blue-600">Vault</span>
            </h1>
            {showCitySelector && (
              <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                Curated, opinionated travel guides designed for offline use.
              </p>
            )}
          </div>
        )}

        {/* 2. Resume Session Card: Hide if we've already started the selection process */}
        {activeSession && !pack && !selectedCity && (
          <div className="mb-10 p-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[34px] shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    {isOffline ? 'Offline Mode Active' : 'Vault Detected'}
                  </p>
                  <h3 className="text-xl font-bold">Resume {activeSession} Session</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCity(activeSession as SupportedCity)}
                className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-50 transition-colors"
              >
                Open Vault
              </button>
            </div>
          </div>
        )}
  
        {/* 3. City Search: Hidden in Standalone + Active Session */}
        {showCitySelector && (
          <div ref={containerRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Select Your Destination
            </h2>
            <CityInput
              value={selectedCity ?? ''}
              onChange={(value) => setSelectedCity(value as SupportedCity)}
              onPackSelect={setSelectedCity}
            />
            {isLoading && <p className="mt-4 text-center text-slate-500 animate-pulse">Accessing Vault...</p>}
            {error && <div className="mt-4 p-4 border rounded-lg bg-red-50 text-red-600 border-red-200">{error}</div>}
          </div>
        )}
  
        {/* 4. MAIN VAULT CONTENT */}
        {pack && !isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 mb-12">
            {!isOffline && (
              <button 
                onClick={() => { setPack(null); setSelectedCity(null); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-2 flex items-center gap-2 transition-colors"
              >
                ← Change Destination
              </button>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pack.city}, {pack.country}</h2>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">
                      Verified Tactical Asset
                    </p>
                  </div>
                  {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                </div>
              </div>
  
              {pack?.tiers?.tier1 && selectedCity && (
                <OfflineSearch cityName={selectedCity} onResultClick={() => {}} />
              )}
  
              {pack.tiers?.tier1 && <ProblemFirstNavigation pack={pack} />}
  
              {pack.tiers?.tier2 && (
                <div className="px-6 sm:px-10 py-6 border-t border-slate-100">
                  <PremiumUnlock tier="tier2" city={pack.city} />
                </div>
              )}
  
              <div className="mt-6 pt-6 border-t border-slate-100 pb-6">
                <TravelPackDownload pack={pack} />
              </div>
            </div>
          </div>
        )}
  
        {/* 5. SPONTANEITY & MOMENTS: 
            FIX: Only show if a specific city pack is NOT currently loaded. 
            This stops the module from showing twice or cluttering the city vault. */}
        {!pack && (
          <div className="animate-in fade-in duration-1000">
            <Spontaneity pack={pack} />
          </div>
        )}
  
      </main>

      {!isStandalone && (
        <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16">
          <div className="container mx-auto max-w-4xl px-6 sm:px-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <Link href="/privacy" className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                  Privacy
                </Link>
                <Link href="/terms" className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                  Terms
                </Link>
              </div>
              <p className="text-[12px] text-slate-400 font-medium">
                © {new Date().getFullYear()} Dan Meier. Verified Tactical Logic.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}