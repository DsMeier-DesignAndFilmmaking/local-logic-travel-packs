'use client';

import { useState, useEffect } from 'react';
import { fetchCitySuggestions, CitySuggestion } from '@/lib/citySearch';
import { fetchTravelPackForCity } from '@/lib/fetchTravelPack';
import { TravelInsight } from '@/lib/travelPackSchema';

interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onPackSelect?: (insights: TravelInsight[]) => void;
}

export default function CityInput({ 
  value,
  onChange,
  placeholder = 'Enter a city name...',
  disabled = false,
  onPackSelect
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!value || disabled) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 300); // debounce

    return () => clearTimeout(handler);
  }, [value, disabled]);

  const handleSelect = (fullName: string) => {
    onChange(fullName);
    setSuggestions([]);
    
    // Fetch travel pack for selected city
    if (onPackSelect) {
      const insights = fetchTravelPackForCity(fullName);
      onPackSelect(insights);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      {suggestions.length > 0 && !disabled && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto text-sm">
          {suggestions.map((s, index) => (
            <li
              key={`${s.fullName}-${index}`}
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
}
