'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchTravelPackForCity } from '@/lib/fetchTravelPack';
import { TravelInsight } from '@/lib/travelPackSchema';

interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  fullName: string;
}

interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onPackSelect?: (insights: TravelInsight[]) => void;
}

const CityInput: React.FC<CityInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter a city name...',
  disabled = false,
  onPackSelect,
}) => {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

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
   * Fetch cities from server-side API route (secure - API keys stay server-side)
   */
  const fetchCities = async (query: string) => {
    if (!query || disabled) {
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

  const handleSelect = (selectedCity: string) => {
    onChange(selectedCity);
    setSuggestions([]);

    // Fetch travel pack for selected city
    if (onPackSelect) {
      const insights = fetchTravelPackForCity(selectedCity);
      onPackSelect(insights);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0].fullName);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full" ref={inputRef}>
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
              onClick={() => handleSelect(s.fullName)}
            >
              {s.fullName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityInput;
