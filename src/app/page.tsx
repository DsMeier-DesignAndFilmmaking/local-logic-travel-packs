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


  // Click outside listener to close any dropdowns / focus states (if needed)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // No explicit dropdown state here since CityInput handles its own
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle city selection from CityInput
  const handleCitySelect = (city: SupportedCity) => {
    setSelectedCity(city);

    // Offline-first: try to load cached Tier1 pack
    const offlinePack = getTier1Pack(city);
    if (offlinePack) {
      setPack({
        city: offlinePack.city,
        country: offlinePack.country,
        tiers: { tier1: offlinePack.tier1 },
      });
      setIsLoading(false);
      setError(null);
      setPackNotFound(false);

      // Optionally fetch latest in background without blocking UI
      fetch(`/api/travel-packs?city=${encodeURIComponent(city)}`)
        .then((res) => res.ok ? res.json() : null)
        .then((latest: TravelPack | null) => {
          if (latest) {
            setPack(latest);
            storePackLocally(latest);
          }
        })
        .catch(() => { /* silently fail */ });

      return;
    }

    // If no offline pack, fetch from API
    const fetchPack = async () => {
      setIsLoading(true);
      setError(null);
      setPackNotFound(false);

      try {
        const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(city)}`);
        if (!response.ok) {
          if (response.status === 404) {
            setPack(null);
            setPackNotFound(true);
            return;
          } else {
            throw new Error('Failed to load travel pack');
          }
        }
        const travelPack: TravelPack = await response.json();
        setPack(travelPack);
        setPackNotFound(false);
        storePackLocally(travelPack);
      } catch (err) {
        console.error('Error loading Travel Pack:', err);
        setError('Error loading Travel Pack.');
        setPack(null);
        setPackNotFound(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPack();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <SWRegister />
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            Local Logic Travel Packs
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-4 sm:mb-6 px-4" style={{ color: 'var(--text-primary)' }}>
            Curated, opinionated travel guides designed for offline use. Get the essential information you need without the tourist traps.
          </p>
        </div>

        {/* City Input */}
        <div ref={containerRef} className="rounded-lg shadow-md p-4 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-light)' }}>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            City Selection
          </h2>

          <CityInput
            value={selectedCity ?? ''}
            onChange={() => {}}
            onPackSelect={handleCitySelect}
          />

          {isLoading && <p className="mt-4 text-center" style={{ color: 'var(--text-primary)' }}>Loading Travel Pack...</p>}
          {error && <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: 'var(--error-bg)', borderColor: '#fca5a5' }}><p style={{ color: 'var(--error-text)' }}>{error}</p></div>}
          {packNotFound && !isLoading && (
            <div className="mt-6 p-6 border rounded-lg text-center" style={{ backgroundColor: '#E0F2FE', borderColor: '#93C5FD' }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</h3>
              <p style={{ color: 'var(--text-primary)' }}>We're working on a travel pack for <strong>{selectedCity}</strong>. Check back soon!</p>
            </div>
          )}

          {/* Travel Pack Display */}
          {pack && !isLoading && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg shadow-md p-4 sm:p-6" style={{ backgroundColor: '#1e3a8a', border: '1px solid #1e40af' }}>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-on-dark)' }}>
                      {pack.city}, {pack.country}
                    </h2>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-on-dark-muted)' }}>
                      Offline-ready • Problem-first navigation
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm px-2 py-1 rounded font-medium" style={{ backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
                      Tier 1 Available
                    </span>
                    {pack.tiers?.tier1 && <Tier1Download pack={pack} />}
                  </div>
                </div>

                {pack?.tiers?.tier1 && selectedCity && (
                  <OfflineSearch
                    cityName={selectedCity}
                    onResultClick={(result) => console.log('Clicked:', result)}
                  />
                )}

                {pack.tiers?.tier1 ? (
                  <ProblemFirstNavigation pack={pack} />
                ) : (
                  <div className="p-6 text-center" style={{ color: 'var(--text-on-dark)' }}>
                    <p>Problem-first content not available for this city yet.</p>
                  </div>
                )}

                {(pack.tiers?.tier2 || pack.tiers?.tier3) && (
                  <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-dark)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-on-dark)' }}>
                      Additional Content (Premium)
                    </h3>
                    <div className="space-y-4">
                      {pack.tiers.tier2 && (
                        <div className="p-4 rounded-lg border" style={{ borderColor: '#B45309', backgroundColor: '#FFFBEB' }}>
                          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {pack.tiers.tier2.title}
                          </h4>
                          <PremiumUnlock tier="tier2" city={pack.city} />
                        </div>
                      )}
                      {pack.tiers.tier3 && (
                        <div className="p-4 rounded-lg border" style={{ borderColor: '#6D28D9', backgroundColor: '#FAF5FF' }}>
                          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {pack.tiers.tier3.title}
                          </h4>
                          <PremiumUnlock tier="tier3" city={pack.city} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {pack.tiers?.tier4 && <Spontaneity pack={pack} />}

                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-dark)' }}>
                  <TravelPackDownload pack={pack} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
