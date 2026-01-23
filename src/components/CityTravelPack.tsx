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
  const [userTyping, setUserTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelecting = useRef(false); // Selection guard ref
  const lastSelectedCityRef = useRef<string | null>(null); // Track last selected city

  // Fetch autocomplete suggestions only when user types
  useEffect(() => {
    // Exit early if selection guard is active (prevent race condition)
    if (isSelecting.current) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    // Exit early if no query or user is not typing
    if (!query.trim() || !userTyping) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    // Don't fetch if query exactly matches the last selected city (programmatic change)
    if (lastSelectedCityRef.current && query.trim() === lastSelectedCityRef.current) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    let active = true;
    
    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      // Double-check selection guard and userTyping flag after timeout
      if (isSelecting.current || !userTyping || !active) {
        return;
      }

      // Don't fetch if query exactly matches the last selected city
      if (lastSelectedCityRef.current && query.trim() === lastSelectedCityRef.current) {
        setSuggestions([]);
        setDropdownOpen(false);
        return;
      }

      try {
        const res = await fetchCitySuggestions(query);
        if (!active || !userTyping || isSelecting.current) {
          return;
        }

        // Don't show suggestions if query matches last selected city
        if (lastSelectedCityRef.current && query.trim() === lastSelectedCityRef.current) {
          setSuggestions([]);
          setDropdownOpen(false);
          return;
        }
        
        // Deduplicate by fullName
        const seen = new Set<string>();
        const unique = res.filter(suggestion => {
          if (seen.has(suggestion.fullName)) return false;
          seen.add(suggestion.fullName);
          return true;
        });
        
        setSuggestions(unique);
        // Only open dropdown if user is actively typing and not selecting
        if (userTyping && !isSelecting.current) {
          setDropdownOpen(unique.length > 0);
        }
      } catch (err) {
        if (active && userTyping && !isSelecting.current) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [query, userTyping]);

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

    // Set selection guard BEFORE any state updates (prevents race condition)
    isSelecting.current = true;
    
    // Store the selected city value to check for exact matches
    lastSelectedCityRef.current = city.fullName;
    
    // Close dropdown immediately and keep it closed
    setDropdownOpen(false);
    
    // Explicitly clear suggestions array to prevent dropdown from showing
    setSuggestions([]);
    
    // Set userTyping to false to prevent dropdown reopening
    setUserTyping(false);
    
    // Update state (this will trigger useEffect, but guard will prevent reopening)
    setSelectedCity(city.fullName);
    setQuery(city.fullName);
    
    // Fetch travel pack
    fetchTravelPack(city.name);
    
    // Reset selection guard after a short delay to allow normal typing behavior
    // This ensures all state updates and useEffect runs complete first
    setTimeout(() => {
      isSelecting.current = false;
    }, 100);
  };

  // Input change marks "user is typing"
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Guard: if we're in the middle of selecting, reset flag and exit early
    if (isSelecting.current) {
      isSelecting.current = false;
      return;
    }
    
    const newValue = e.target.value;
    
    // Clear selected city when user manually types something different
    if (selectedCity && newValue !== selectedCity) {
      setSelectedCity(null);
    }
    
    // Clear last selected city ref when user manually types (allows autocomplete to work)
    if (lastSelectedCityRef.current && newValue !== lastSelectedCityRef.current) {
      lastSelectedCityRef.current = null;
    }
    
    setQuery(newValue);
    setUserTyping(true); // only user typing triggers dropdown
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Only open dropdown if:
            // 1. User is actively typing (not programmatic change)
            // 2. Selection guard is not active
            // 3. Suggestions are available
            // 4. Query doesn't match last selected city (exact match check)
            if (
              userTyping &&
              !isSelecting.current &&
              suggestions.length > 0 &&
              (!lastSelectedCityRef.current || query.trim() !== lastSelectedCityRef.current)
            ) {
              setDropdownOpen(true);
            }
          }}
          placeholder="Enter city name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />

        {dropdownOpen && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full border border-gray-300 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((city, idx) => (
              <li
                key={`${city.fullName}-${idx}`}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleSelectCity(city, e);
                }}
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
