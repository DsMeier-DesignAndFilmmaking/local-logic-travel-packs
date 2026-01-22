'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sortTravelInsights } from '@/lib/sortTravelInsights';
import { transformInsightsToUIPack } from '@/lib/transformTravelInsights';
import { fetchTravelPackForCity } from '@/lib/fetchTravelPack';
import PackCard from '@/components/PackCard';
import OfflineDownload from '@/components/OfflineDownload';
import { OfflineTravelPack } from '@/types';

interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  fullName: string;
}

/**
 * Fully Integrated City Autocomplete + Travel Pack Loader
 * 
 * Features:
 * - RapidAPI GeoDB first, Mapbox fallback (via server-side API route)
 * - Deduplicates suggestions
 * - Unique React keys
 * - Dropdown closes on selection, outside click, or Enter key
 * - Auto-fetches and renders Tier 1-3 Travel Pack immediately
 * - Handles errors gracefully
 */
const TravelPackCitySelector: React.FC = () => {
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [travelPack, setTravelPack] = useState<OfflineTravelPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Deduplicate cities by fullName to avoid duplicate suggestions
   */
  const deduplicateCities = (cities: CitySuggestion[]): CitySuggestion[] => {
    const seen = new Set<string>();
    return cities.filter((c) => {
      if (seen.has(c.fullName)) return false;
      seen.add(c.fullName);
      return true;
    });
  };

  /**
   * Fetch city suggestions from server-side API route (secure)
   * Uses RapidAPI GeoDB first, Mapbox fallback (handled server-side)
   */
  const fetchCities = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        console.error('City API error:', res.status, res.statusText);
        setSuggestions([]);
        return;
      }

      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Deduplicate suggestions
        const deduplicated = deduplicateCities(data);
        setSuggestions(deduplicated);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('City API error:', err);
      setSuggestions([]);
    }
  };

  /**
   * Fetch and load Travel Pack for selected city
   * Uses existing Tier 1-3 Travel Pack system
   */
  const loadTravelPack = async (cityName: string) => {
    if (!cityName || !cityName.trim()) {
      setTravelPack(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract city name from full string (e.g., "Paris, Île-de-France, France" -> "Paris")
      const city = cityName.split(',')[0].trim() || cityName.trim();

      // Fetch travel pack insights (Tier 1-3 structure)
      const insights = fetchTravelPackForCity(cityName);

      if (!insights || insights.length === 0) {
        setError('Travel Pack unavailable for this city.');
        setTravelPack(null);
        return;
      }

      // Sort insights by priority score
      const sortedInsights = sortTravelInsights(insights);

      // Transform to UI format (includes all Tier 1-3 content)
      const uiPack = transformInsightsToUIPack(
        city,
        '1.0',
        new Date().toISOString(),
        `A curated travel pack for ${city}, focusing on authentic experiences beyond the tourist traps.`,
        sortedInsights
      );

      setTravelPack(uiPack);
      setError(null);
    } catch (err) {
      console.error('Error loading Travel Pack:', err);
      setError('Error loading Travel Pack.');
      setTravelPack(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounced API call on city input change
  useEffect(() => {
    const handler = setTimeout(() => fetchCities(city), 250);
    return () => clearTimeout(handler);
  }, [city]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle city selection from dropdown or Enter key
   */
  const handleSelect = async (selectedCity: string) => {
    setCity(selectedCity);
    setSuggestions([]);
    
    // Auto-fetch Travel Pack immediately
    await loadTravelPack(selectedCity);
  };

  /**
   * Handle Enter key - select first suggestion
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0].fullName);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* City Input with Autocomplete */}
      <div className="relative w-full mb-8" ref={containerRef}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter city name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        
        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
            {suggestions.map((s, idx) => (
              <li
                key={`${s.fullName}-${idx}`}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={() => handleSelect(s.fullName)}
              >
                {s.fullName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p>Loading Travel Pack...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Travel Pack Display - Auto-loaded when city is selected */}
      {travelPack && !loading && (
        <div className="space-y-6">
          <PackCard pack={travelPack} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <OfflineDownload pack={travelPack} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPackCitySelector;
