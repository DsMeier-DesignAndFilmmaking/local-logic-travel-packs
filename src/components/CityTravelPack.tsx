'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchCitySuggestions, CitySuggestion } from '@/lib/citySearch';
import { TravelPack } from '@/lib/travelPacks';

export default function CityTravelPack() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [travelPack, setTravelPack] = useState<TravelPack | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Fetch autocomplete suggestions
  useEffect(() => {
    // Don't fetch suggestions if we're in the process of selecting a city
    if (isSelectingRef.current) {
      return;
    }

    if (!query.trim()) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchCitySuggestions(query);
        if (active && !isSelectingRef.current) {
          // Deduplicate by fullName
          const seen = new Set<string>();
          const unique = res.filter(suggestion => {
            if (seen.has(suggestion.fullName)) return false;
            seen.add(suggestion.fullName);
            return true;
          });
          setSuggestions(unique);
          setDropdownOpen(unique.length > 0);
        }
      } catch (err) {
        if (active && !isSelectingRef.current) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch travel pack for selected city
  const fetchTravelPack = async (cityName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract just the city name (before first comma) for matching
      const cityNameOnly = cityName.split(',')[0].trim();
      const response = await fetch(`/api/travel-packs?city=${encodeURIComponent(cityNameOnly)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`No travel pack available for ${cityNameOnly}`);
        } else {
          setError('Failed to load travel pack');
        }
        setTravelPack(null);
        return;
      }

      const pack: TravelPack = await response.json();
      setTravelPack(pack);
    } catch (err) {
      console.error('Error fetching travel pack:', err);
      setError('Failed to load travel pack');
      setTravelPack(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle city selection
  const handleSelectCity = (city: CitySuggestion, event?: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering outside click handler
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Set flag to prevent autocomplete from reopening dropdown
    isSelectingRef.current = true;

    // Close dropdown immediately
    setDropdownOpen(false);
    
    // Clear suggestions to prevent dropdown from showing
    setSuggestions([]);

    // Update state
    setSelectedCity(city.fullName);
    setQuery(city.fullName);
    
    // Fetch travel pack
    fetchTravelPack(city.name);

    // Reset flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelectCity(suggestions[0]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-4" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter city name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />

        {dropdownOpen && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full border border-gray-300 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((city, idx) => (
              <li
                key={`${city.fullName}-${idx}`}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                onClick={(e) => handleSelectCity(city, e)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {city.fullName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Loading travel pack...
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {travelPack && !loading && (
        <div className="mt-6 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {travelPack.city}, {travelPack.country}
          </h2>
          
          <div className="space-y-6">
            {/* Tier 1 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {travelPack.tier1.title}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {travelPack.tier1.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {travelPack.tier2.title}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {travelPack.tier2.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {travelPack.tier3.title}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {travelPack.tier3.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
