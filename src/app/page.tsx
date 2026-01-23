'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchCitySuggestions, CitySuggestion } from '@/lib/citySearch';
import { TravelPack } from '@/lib/travelPacks';
import TravelPackDownload from '@/components/TravelPackDownload';
import PremiumUnlock from '@/components/PremiumUnlock';
import { storePackLocally, getTier1Pack } from '@/lib/offlineStorage';
import ProblemFirstNavigation from '@/components/ProblemFirstNavigation';
import OfflineSearch from '@/components/OfflineSearch';
import Spontaneity from '@/components/Spontaneity';
import { preloadAllPacksBackground } from '@/lib/preloadPacks';

type InteractionStatus = 'IDLE' | 'TYPING' | 'SELECTED';

export default function Home() {
  // City Input State (State Machine)
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState('');
  const [pack, setPack] = useState<TravelPack | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [status, setStatus] = useState<InteractionStatus>('IDLE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packNotFound, setPackNotFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions when user types (only when TYPING)
  useEffect(() => {
    if (status !== 'TYPING' || !cityQuery.trim()) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      if (!active || status !== 'TYPING') return;

      try {
        const res = await fetchCitySuggestions(cityQuery);
        if (!active || status !== 'TYPING') return;

        // Deduplicate suggestions by fullName using Set
        const unique = Array.from(
          new Map(res.map(s => [s.fullName, s])).values()
        );
        setSuggestions(unique);
      } catch (err) {
        if (active && status === 'TYPING') {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [cityQuery, status]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setStatus('IDLE');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preload all travel packs for offline access on initial page load
  useEffect(() => {
    preloadAllPacksBackground();
  }, []);

  // Auto-fetch Travel Pack when city changes - Offline-first: no network calls if cached
  useEffect(() => {
    if (!city || !city.trim()) {
      setPack(null);
      setError(null);
      setPackNotFound(false);
      return;
    }

    const cityNameOnly = city.split(',')[0].trim();

    // Offline-first: Try to load from offline cache first (no network calls)
    const offlinePack = getTier1Pack(cityNameOnly);
    if (offlinePack) {
      // Use offline content immediately - no network call needed
      setPack({
        city: offlinePack.city,
        country: offlinePack.country,
        tiers: {
          tier1: offlinePack.tier1,
        },
      });
      setIsLoading(false);
      setError(null);
      setPackNotFound(false);
      
      // Optionally refresh in background (non-blocking) for updates
      // But don't show loading state or block UI
      fetch(`/api/travel-packs?city=${encodeURIComponent(cityNameOnly)}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return null;
        })
        .then((travelPack: TravelPack | null) => {
          if (travelPack) {
            // Update with latest data and cache it
            setPack(travelPack);
            try {
              storePackLocally(travelPack);
            } catch (err) {
              console.warn('Failed to cache pack locally:', err);
            }
          }
        })
        .catch(() => {
          // Silently fail - we already have offline data
        });
      
      return; // Exit early - offline data is available
    }

    // Only fetch from network if offline data doesn't exist
    const fetchPack = async () => {
      setIsLoading(true);
      setError(null);
      setPackNotFound(false);

      try {
        // Call API route to get travel pack
        const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(cityNameOnly)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Pack not found - show "Coming soon" message
            setPack(null);
            setPackNotFound(true);
            setError(null);
          } else {
            setError('Failed to load travel pack');
            setPack(null);
            setPackNotFound(false);
          }
          return;
        }

        const travelPack: TravelPack = await response.json();
        setPack(travelPack);
        setPackNotFound(false);
        setError(null);
        
        // Automatically cache Tier 1 content for offline access (offline-first)
        try {
          storePackLocally(travelPack);
        } catch (err) {
          console.warn('Failed to cache pack locally:', err);
        }
      } catch (err) {
        console.error('Error loading Travel Pack:', err);
        setError('Error loading Travel Pack.');
        setPack(null);
        setPackNotFound(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPack, 100);
    return () => clearTimeout(timeoutId);
  }, [city]);

  // Handle selection
  const handleSelect = (selectedCity: CitySuggestion) => {
    setCityQuery(selectedCity.fullName);
    setCity(selectedCity.fullName);
    setStatus('SELECTED'); // Terminal state - prevents dropdown from re-opening
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setStatus('TYPING');
    setCityQuery(newValue);
  };

  // Handle focus (re-open logic)
  const handleInputFocus = () => {
    if (cityQuery.length > 0) {
      setStatus('TYPING');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && status === 'TYPING' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    } else if (e.key === 'Escape') {
      setStatus('IDLE');
    }
  };

  // Visibility gate
  const shouldShowDropdown = status === 'TYPING' && suggestions.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ color: '#1A1A1A' }}>
            Local Logic Travel Packs
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-4 sm:mb-6 px-4" style={{ color: '#1A1A1A' }}>
            Curated, opinionated travel guides designed for offline use. Get the essential information you need without the tourist traps.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm px-4" style={{ color: '#1A1A1A' }}>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">✓</span>
              <span>Designed for offline use</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">✓</span>
              <span>Avoids tourist traps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">✓</span>
              <span>Built for fast decisions while traveling</span>
            </div>
          </div>
        </div>
        
        {/* City Input - State Machine */}
        <div className="rounded-lg shadow-md p-4 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4" style={{ color: '#1A1A1A' }}>
            City Selection
          </h2>
          <div className="relative mb-4" ref={containerRef}>
            <input
              type="text"
              value={cityQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                backgroundColor: '#FFFFFF', 
                color: '#1A1A1A', 
                borderColor: '#D1D5DB',
                minHeight: '44px' // Touch-friendly
              }}
            />

            {/* VISIBILITY GATE: Only render if status === 'TYPING' && suggestions.length > 0 */}
            {shouldShowDropdown && (
              <ul 
                className="absolute z-50 mt-1 w-full border rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#D1D5DB',
                  WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                }}
              >
                {suggestions.map((city, idx) => (
                  <li
                    key={`${city.fullName}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent focus-jitter
                      handleSelect(city);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleSelect(city);
                    }}
                    className="px-4 py-3 cursor-pointer transition-colors touch-manipulation"
                    style={{ 
                      color: '#1A1A1A',
                      minHeight: '44px', // Touch-friendly
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0F2FE'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    {city.fullName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="mt-4 text-center" style={{ color: '#1A1A1A' }}>
              <p>Loading Travel Pack...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
              <p style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Coming soon message */}
          {packNotFound && !isLoading && (
            <div className="mt-6 p-6 border rounded-lg text-center" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                Coming Soon
              </h3>
              <p style={{ color: '#1A1A1A' }}>
                We're working on a travel pack for <strong>{city.split(',')[0].trim()}</strong>. Check back soon!
              </p>
            </div>
          )}

          {/* Travel Pack Display - Problem-First Navigation (Offline-First) */}
          {pack && !isLoading && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg shadow-md p-4 sm:p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1A1A1A' }}>
                      {pack.city}, {pack.country}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Offline-ready • Problem-first navigation
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm px-2 py-1 rounded" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                    Tier 1 Available
                  </span>
                </div>

                {/* Offline Search */}
                <div className="mb-6">
                  <OfflineSearch cityName={pack.city} />
                </div>

                {/* Problem-First Navigation */}
                {pack.tiers?.tier1 ? (
                  <ProblemFirstNavigation pack={pack} />
                ) : (
                  <div className="p-6 text-center" style={{ color: '#1A1A1A' }}>
                    <p>Problem-first content not available for this city yet.</p>
                  </div>
                )}

                {/* Premium Tiers (Optional) */}
                {(pack.tiers?.tier2 || pack.tiers?.tier3) && (
                  <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#1A1A1A' }}>
                      Additional Content (Premium)
                    </h3>
                    <div className="space-y-4">
                      {pack.tiers.tier2 && (
                        <div className="p-4 rounded-lg border" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                          <h4 className="font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                            {pack.tiers.tier2.title}
                          </h4>
                          <PremiumUnlock tier="tier2" city={pack.city} />
                        </div>
                      )}
                      {pack.tiers.tier3 && (
                        <div className="p-4 rounded-lg border" style={{ borderColor: '#8B5CF6', backgroundColor: '#FAF5FF' }}>
                          <h4 className="font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                            {pack.tiers.tier3.title}
                          </h4>
                          <PremiumUnlock tier="tier3" city={pack.city} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spontaneity / Moments Section (Tier 4) */}
                {pack.tiers?.tier4 && (
                  <Spontaneity pack={pack} />
                )}

                {/* Download Button */}
                <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
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
