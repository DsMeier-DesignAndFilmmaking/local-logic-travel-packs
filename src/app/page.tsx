'use client';

import { useState, useEffect, useRef } from 'react';
import CityInput from '@/components/CityInput';
import { TravelPack } from '@/lib/travelPacks';
import { storePackLocally } from '@/lib/offlineStorage';
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
  
  // NEW: State for the "Resume Session" feature
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Preload and Check for Offline Sessions
  useEffect(() => {
    preloadAllPacksBackground();
    
    const checkActiveSession = async () => {
      try {
        const localPacks = await getAllPacks();
        if (localPacks && localPacks.length > 0) {
          // Take the most recently saved city
          setActiveSession(localPacks[0].city);
        }
      } catch (err) {
        console.warn("Could not retrieve offline sessions", err);
      }
    };
    checkActiveSession();
  }, []);

  // 2. Refactored Offline-first loading
  useEffect(() => {
    if (!selectedCity) return;

    const loadPack = async () => {
      setIsLoading(true);
      setError(null);
      setPackNotFound(false);

      try {
        // First: Attempt to pull from IndexedDB
        const offlinePack = await getPack(selectedCity);

        if (offlinePack) {
          setPack({
            city: offlinePack.city,
            country: offlinePack.country,
            tiers: offlinePack.tiers, 
          });
          setIsLoading(false);
          console.log(`📦 Loaded from Offline Vault: ${selectedCity}`);
          return; 
        }

        // Second: If offline and not in DB, show error
        if (!navigator.onLine) {
          setPackNotFound(true);
          setIsLoading(false);
          return;
        }

        // Third: Fetch from Network
        const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(selectedCity)}`);
        
        if (!response.ok) {
          if (response.status === 404) setPackNotFound(true);
          else setError('Failed to load travel pack');
          setPack(null);
          return;
        }

        const travelPack = await response.json();
        setPack(travelPack);

        // Auto-persist to DB for next time
        try {
          await savePack(travelPack);
        } catch (err) {
          console.warn('Sync failed', err);
        }

      } catch (err) {
        console.error('Vault Access Error:', err);
        setError('Error loading tactical data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPack();
  }, [selectedCity]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <SWRegister />
      <main className="container mx-auto px-5 py-12 max-w-4xl">
        
        {/* 1. Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            Local Logic <span className="text-blue-600">Travel Packs</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Curated, opinionated travel guides designed for offline use.
          </p>
        </div>

        {/* 2. OPTIMIZED UX: Active Session Card */}
        {activeSession && !pack && (
          <div className="mb-10 p-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[34px] shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Offline Vault Active</p>
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
  
        {/* 3. City Search Container */}
        <div ref={containerRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {pack ? 'Change Destination' : 'Select Your Destination'}
          </h2>
  
          <CityInput
            value={selectedCity ?? ''}
            onChange={(value) => setSelectedCity(value as SupportedCity)}
            onPackSelect={setSelectedCity}
          />
  
          {isLoading && <p className="mt-4 text-center text-slate-500 animate-pulse">Accessing Vault...</p>}
          {error && <div className="mt-4 p-4 border rounded-lg bg-red-50 text-red-600 border-red-200">{error}</div>}
          
          {packNotFound && !isLoading && (
            <div className="mt-6 p-6 border rounded-lg text-center bg-blue-50 border-blue-200">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">Coming Soon</h3>
              <p className="text-slate-600">We're working on a travel pack for <strong>{selectedCity}</strong>.</p>
            </div>
          )}
        </div>
  
        {/* 4. Travel Pack Results */}
        {pack && !isLoading && (
          <div className="animate-fadeIn space-y-6 mb-12">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              {/* Dark Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pack.city}, {pack.country}</h2>
                    <p className="text-slate-300 mt-1">Tactical Asset • Fully Downloaded</p>
                  </div>
                  {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                </div>
              </div>
  
              {pack?.tiers?.tier1 && selectedCity && (
                <OfflineSearch cityName={selectedCity} onResultClick={() => {}} />
              )}
  
              {pack.tiers?.tier1 && <ProblemFirstNavigation pack={pack} />}
  
              {/* Premium Section */}
              {pack.tiers?.tier2 && (
                <div className="px-6 sm:px-10 py-6 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Additional Content</h3>
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <h4 className="font-bold text-amber-900 mb-2">{pack.tiers.tier2.title}</h4>
                    <PremiumUnlock tier="tier2" city={pack.city} />
                  </div>
                </div>
              )}
  
              {/* Unified Sync/Download Control */}
              <div className="mt-6 pt-6 border-t border-slate-100 pb-6">
                <TravelPackDownload pack={pack} />
              </div>
            </div>
          </div>
        )}
  
        {/* 5. Spontaneity Section */}
        <div className={`transition-all duration-700 ease-in-out ${pack ? 'mt-20 opacity-100' : 'mt-0 opacity-100'}`}>
          <Spontaneity pack={pack} />
        </div>
  
      </main>

      <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16">
        <div className="container mx-auto max-w-4xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Local Logic <span className="text-blue-600">Travel Packs</span>
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                High-fidelity, offline-first tactical intelligence for global travelers.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Reliability</h4>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Source: Experienced travelers. Use as a supporting resource for official guidance.
              </p>
            </div>
          </div>
  
          <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link href="/privacy" className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy</Link>
              <Link href="/terms" className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Terms</Link>
              <Link href="/sources" className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Sources</Link>
            </div>
            <p className="text-[12px] text-slate-400 font-medium">© {new Date().getFullYear()} Dan Meier.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}