'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_CITIES, SupportedCity } from '@/lib/cities';
import { getPack } from '../../scripts/offlineDB'; 

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
  hidden?: boolean; // Prop to trigger UI lockdown
}

export default function CityInput({
  value,
  onChange,
  hidden = false,
  placeholder = 'Search tactical vaults...',
  disabled = false,
  onPackSelect,
}: CityInputProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  // 1. LOCKDOWN CHECK
  // If the app is in "Vault Active" or Offline mode, we remove this entirely
  if (hidden) return null;

  const deduplicateCities = (cities: CitySuggestion[]): CitySuggestion[] => {
    const seen = new Set<string>();
    return cities.filter(c => {
      if (seen.has(c.fullName)) return false;
      seen.add(c.fullName);
      return true;
    });
  };

  const handleSelect = async (selectedCity: string) => {
    onChange(selectedCity);
    setSuggestions([]);
  
    if (onPackSelect && SUPPORTED_CITIES.includes(selectedCity as SupportedCity)) {
      onPackSelect(selectedCity as SupportedCity);
  
      // Immediate DB check to give the UI a head-start on loading state
      const offlinePack = await getPack(selectedCity as SupportedCity);
      if (offlinePack) {
        console.log(`📦 Tactical match found in local vault: ${selectedCity}`);
      }
    }
  };

  const fetchCities = async (query: string) => {
    if (!query || disabled) {
      setSuggestions([]);
      return;
    }

    try {
      // 2. OFFLINE FALLBACK LOGIC
      // If the user is offline but somehow interacting with the search, 
      // only suggest cities we actually support (and thus might have cached).
      if (!navigator.onLine) {
        const matches = SUPPORTED_CITIES.filter(city =>
          city.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(matches.map(c => ({ 
          name: c, 
          region: 'Local Vault', 
          country: '', 
          fullName: c 
        })));
        return;
      }

      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
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

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCities(value);
    }, 250);
    return () => clearTimeout(handler);
  }, [value, disabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* SEARCH DROPDOWN */}
      {suggestions.length > 0 && !disabled && (
        <ul className="absolute z-50 mt-3 w-full bg-white border border-slate-100 rounded-[24px] shadow-2xl shadow-slate-200/50 max-h-64 overflow-y-auto p-2 overflow-hidden">
          {suggestions.map((s, idx) => (
            <li
              key={`${s.fullName}-${idx}`}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-sm transition-colors flex justify-between items-center group"
              onMouseDown={() => handleSelect(s.fullName)}
            >
              <span>{s.fullName}</span>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest group-hover:text-blue-500">
                {SUPPORTED_CITIES.includes(s.fullName as SupportedCity) ? 'Vault Ready' : 'Global'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* QUICK SELECTION CHIPS */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SUPPORTED_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => handleSelect(city)}
            className="px-4 py-2 bg-slate-100/50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-xs font-black uppercase tracking-tighter"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}