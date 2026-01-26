'use client';

import { useState, useEffect, useRef } from 'react';
import CityInput from '@/components/CityInput';
import { TravelPack } from '@/lib/travelPacks';
import { storePackLocally, getTier1Pack } from '@/lib/offlineStorage';
import { preloadAllPacksBackground } from '@/lib/preloadPacks';
import { SUPPORTED_CITIES, SupportedCity } from '@/lib/cities';



import TravelPackDownload from '@/components/TravelPackDownload';
import Tier1Download from '@/components/Tier1Download';
import PremiumUnlock from '@/components/PremiumUnlock';
import ProblemFirstNavigation from '@/components/ProblemFirstNavigation';
import OfflineSearch from '@/components/OfflineSearch';
import Spontaneity from '@/components/Spontaneity';

import Link from 'next/link';
import { getPack, savePack } from '../../scripts/offlineDB';


function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('Service Worker registered:', reg))
          .catch((err) => console.error('Service Worker registration failed:', err));
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

  const containerRef = useRef<HTMLDivElement>(null);

  const cityNameOnly = selectedCity;

  // Preload all offline packs on initial load
  useEffect(() => {
    preloadAllPacksBackground();
  }, []);

  // Preload all offline packs on initial load
useEffect(() => {
  preloadAllPacksBackground();
}, []);

// Step 5 — Offline-first travel pack loading when a city is selected
useEffect(() => {
  if (!selectedCity) return;

  // Try offline cache first
  const offlinePack = getTier1Pack(selectedCity);

  if (offlinePack) {
    setPack({
      city: offlinePack.city,
      country: offlinePack.country,
      tiers: { tier1: offlinePack.tier1 },
    });
    setIsLoading(false);
    setError(null);
    setPackNotFound(false);
    console.log(`📦 Loaded offline pack for ${selectedCity}`);
    return; // Exit early — offline data is available
  }

  // If offline and no cached pack, show "coming soon/offline" state
  if (!navigator.onLine) {
    setPackNotFound(true);
    setPack(null);
    setIsLoading(false);
    setError(null);
    return;
  }

  // Otherwise, fetch from network
  const fetchPackFromAPI = async (city: SupportedCity) => {
    setIsLoading(true);
    setError(null);
    setPackNotFound(false);

    try {
      const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        if (response.status === 404) {
          setPackNotFound(true);
          setPack(null);
        } else {
          setError('Failed to load travel pack');
          setPack(null);
        }
        return;
      }

      const travelPack = await response.json();
      setPack(travelPack);
      setPackNotFound(false);

      // Cache for offline use
      try {
        storePackLocally(travelPack);
      } catch (err) {
        console.warn('Failed to cache pack locally:', err);
      }
    } catch (err) {
      console.error('Error fetching pack:', err);
      setError('Error loading travel pack');
      setPack(null);
      setPackNotFound(false);
    } finally {
      setIsLoading(false);
    }
  };

  fetchPackFromAPI(selectedCity);
}, [selectedCity]);


  // Step 3 & 5 — Refactored Offline-first loading
useEffect(() => {
  if (!selectedCity) return;

  const loadPack = async () => {
    setIsLoading(true);
    setError(null);
    setPackNotFound(false);

    try {
      // 1. ASYNC DB CHECK (Critical Fix)
      const offlinePack = await getPack(selectedCity);

      if (offlinePack) {
        // Map the stored data to your state structure
        setPack({
          city: offlinePack.city,
          country: offlinePack.country,
          // Use the deep tiers from your Bangkok JSON
          tiers: offlinePack.tiers, 
        });
        setIsLoading(false);
        console.log(`📦 Tactical Vault: Offline data retrieved for ${selectedCity}`);
        
        // If we are online, we can silently re-fetch in the background to update, 
        // but for now, we return to satisfy the "Offline-First" requirement.
        return; 
      }

      // 2. NETWORK FALLBACK
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

      // 3. PERSIST FOR FUTURE OFFLINE USE
      try {
        await savePack(travelPack);
      } catch (err) {
        console.warn('Failed to sync to local vault:', err);
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
  
        {/* 2. City Search Container (White Box) */}
        <div ref={containerRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Select Your Destination
          </h2>
  
          <CityInput
            value={selectedCity ?? ''}
            onChange={(value) => setSelectedCity(value as SupportedCity)}
            onPackSelect={setSelectedCity}
          />
  
          {isLoading && <p className="mt-4 text-center text-slate-500">Loading Travel Pack...</p>}
          {error && <div className="mt-4 p-4 border rounded-lg bg-red-50 text-red-600 border-red-200">{error}</div>}
          {packNotFound && !isLoading && (
            <div className="mt-6 p-6 border rounded-lg text-center bg-blue-50 border-blue-200">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">Coming Soon</h3>
              <p className="text-slate-600">We're working on a travel pack for <strong>{selectedCity}</strong>.</p>
            </div>
          )}
        </div> {/* END Search Container */}
  
        {/* 3. Travel Pack Results (Only shows when pack is loaded) */}
        {pack && !isLoading && (
          <div className="animate-fadeIn space-y-6 mb-12">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              {/* Dark Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pack.city}, {pack.country}</h2>
                    <p className="text-slate-300 mt-1">Offline-ready • Problem-first navigation</p>
                  </div>
                  {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                </div>
              </div>
  
              {/* Navigation & Search */}
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
  
              {/* Download Row */}
              <div className="mt-6 pt-6 border-t border-slate-100 pb-6">
                <TravelPackDownload pack={pack} />
              </div>
            </div>
          </div>
        )}
  
        {/* 4. Spontaneity Section (Outside the Search Container & Pack Results) */}
        <div className={`transition-all duration-700 ease-in-out ${pack ? 'mt-20 opacity-100' : 'mt-0 opacity-100'}`}>
          <Spontaneity pack={pack} />
        </div>
  
      </main>
      <footer className="mt-20 border-t border-slate-100 bg-slate-50/50 py-16">
  <div className="container mx-auto max-w-4xl px-6 sm:px-10">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
      {/* Brand Column */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Local Logic <span className="text-blue-600">Travel Packs</span>
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          High-fidelity, offline-first tactical intelligence for global travelers. Built to manage friction and navigate the unexpected.
        </p>
      </div>

      {/* Trust/Legal Column */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Reliability & Accuracy
        </h4>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          While the logic is sourced from experienced travelers and real-time data, travel conditions change rapidly. Use this information as a supporting resource, not as a replacement for official local guidance or professional emergency services.
        </p>
      </div>
    </div>

    {/* Bottom Legal Bar */}    
<div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
  <div className="flex flex-wrap gap-x-8 gap-y-2">
    {/* Update: Changed button to Link and added href */}
    <Link 
      href="/privacy" 
      className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
    >
      Privacy Policy
    </Link>

    <Link 
      href="/terms" 
      className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
    >
      Terms of Service
    </Link>

    <Link 
      href="/sources" 
      className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
    >
      Data Sources
    </Link>

    <Link 
      href="/support" 
      className="text-[12px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
    >
      Contact Support
    </Link>
  </div>
  
  <p className="text-[12px] text-slate-400 font-medium">
    © {new Date().getFullYear()} Dan Meier. All rights reserved.
  </p>
</div>
  </div>
</footer>
    </div>
  );
}
