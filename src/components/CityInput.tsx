'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_CITIES, SupportedCity } from '@/lib/cities';
import { getTier1Pack } from '../../scripts/offlineDB'; // function that returns offline pack if preloaded

export interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  fullName: string;
}

export interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onPackSelect?: (city: SupportedCity) => void;

  // NEW: hide the search bar
  hidden?: boolean;
}

export default function CityInput({
  value,
  onChange,
  hidden = false,
  placeholder = 'Enter a city name...',
  disabled = false,
  onPackSelect,
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  /**
   * Deduplicate cities by fullName to avoid duplicates
   */
  const deduplicateCities = (cities: CitySuggestion[]): CitySuggestion[] => {
    const seen = new Set<string>();
    return cities.filter(c => {
      if (seen.has(c.fullName)) return false;
      seen.add(c.fullName);
      return true;
    });
  };

  /**
   * Handle selecting a city
   */
  const handleSelect = async (selectedCity: string) => {
    onChange(selectedCity);
    setSuggestions([]);
  
    // Only fire callback if city is supported
    if (onPackSelect && SUPPORTED_CITIES.includes(selectedCity as SupportedCity)) {
      onPackSelect(selectedCity as SupportedCity);
  
      // Load offline pack immediately if available
      const offlinePack = await getTier1Pack(selectedCity as SupportedCity);
      if (offlinePack) {
        console.log(`📦 Loaded offline pack for ${selectedCity}`);
      }
    }
  };

  /**
   * Fetch suggestions from server API (with offline fallback)
   */
  const fetchCities = async (query: string) => {
    if (!query || disabled) {
      setSuggestions([]);
      return;
    }

    try {
      // If offline, skip network fetch
      if (!navigator.onLine) {
        console.log('📴 Offline — skipping city API search');
        // Optional: show only matching supported cities offline
        const matches = SUPPORTED_CITIES.filter(city =>
          city.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(matches.map(c => ({ name: c, region: '', country: '', fullName: c })));
        return;
      }

      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        console.error('City API error:', res.status, res.statusText);
        setSuggestions([]);
        return;
      }

      const data: CitySuggestion[] = await res.json();
      setSuggestions(deduplicateCities(data));
    } catch (error) {
      console.error('City API error:', error);
      setSuggestions([]);
    }
  };

  // Debounce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCities(value);
    }, 250);

    return () => clearTimeout(handler);
  }, [value, disabled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Enter/Escape keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0].fullName);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  // If hidden, render an empty div to preserve layout
  if (hidden) {
    return <div style={{ height: '44px' }} />; // keeps spacing but hides input
  }

  return (
    <div className="relative w-full" ref={inputRef}>
      {/*
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />

      {suggestions.length > 0 && !disabled && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          {suggestions.map((s, idx) => (
            <li
              key={`${s.fullName}-${idx}`}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              onMouseDown={() => handleSelect(s.fullName)}
            >
              {s.fullName}
            </li>
          ))}
        </ul>
      )} 
       */}

      {/* Optional: Add quick buttons for 10 global cities offline */}
      <div className="mt-2 flex flex-wrap gap-2">
        {SUPPORTED_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-semibold dark:bg-slate-100 dark:text-slate-800 dark:hover:bg-slate-200"
            onClick={() => handleSelect(city)}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
