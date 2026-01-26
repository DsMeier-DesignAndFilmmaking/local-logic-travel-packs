'use client';

import React, { useState, useEffect, useRef } from 'react';
// Updated Imports
import { fetchTravelPack } from '@/lib/fetchTravelPack'; 
import { normalizeCityName } from '@/lib/cities';
import { TravelPack } from '@/lib/travelPacks';
import PackCard from '@/components/PackCard';
import Tier1Download from '@/components/Tier1Download';

interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  fullName: string;
}

const TravelPackCitySelector: React.FC = () => {
  const [cityInput, setCityInput] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [activePack, setActivePack] = useState<TravelPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch city suggestions from API
   */
  const fetchCities = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data)) {
        // Deduplicate
        const unique = data.filter((v, i, a) => 
          a.findIndex(t => t.fullName === v.fullName) === i
        );
        setSuggestions(unique);
      }
    } catch (err) {
      console.error('City API error:', err);
    }
  };

  /**
   * Load the Tactical Pack using the new Coordinator
   */
  const loadTacticalData = async (fullName: string) => {
    setLoading(true);
    setError(null);

    try {
      // USE NORMALIZATION: Ensures "New York, USA" matches "new_york"
      const normalizedName = normalizeCityName(fullName);
      
      // FETCH: Uses the refined coordinator logic
      const pack = fetchTravelPack(fullName);

      if (!pack) {
        setError(`Tactical intelligence for ${fullName.split(',')[0]} is restricted or generating.`);
        setActivePack(null);
      } else {
        setActivePack(pack);
      }
    } catch (err) {
      setError('System error retrieving tactical data.');
      setActivePack(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => fetchCities(cityInput), 300);
    return () => clearTimeout(handler);
  }, [cityInput]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = async (selectedCity: string) => {
    setCityInput(selectedCity);
    setSuggestions([]);
    await loadTacticalData(selectedCity);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelect(suggestions[0].fullName);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Search Input Section */}
      <div className="relative mb-12" ref={containerRef}>
        <div className="relative group">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Target City..."
            className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-[24px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all shadow-xl shadow-slate-200/50"
          />
        </div>
        
        {/* Dropdown Results */}
        {suggestions.length > 0 && (
          <div className="absolute z-[100] mt-3 w-full bg-white border-2 border-slate-900 rounded-[24px] shadow-2xl overflow-hidden">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.fullName}-${idx}`}
                className="w-full px-6 py-4 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex flex-col"
                onClick={() => handleSelect(s.fullName)}
              >
                <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{s.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.region}, {s.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content States */}
      <div className="min-h-[200px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Asset...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[32px] text-center animate-in fade-in zoom-in-95">
            <p className="text-rose-600 font-bold text-sm uppercase tracking-tight mb-4">{error}</p>
            <button 
              onClick={() => setCityInput('')}
              className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors"
            >
              Reset Terminal
            </button>
          </div>
        )}

        {activePack && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* The Main Pack View (Now using updated Tier 1-4 types) */}
            <PackCard pack={activePack as any} />
            
            {/* The Sync/PWA Controller */}
            <div className="p-2 bg-slate-50 rounded-[32px] border border-slate-100">
              <Tier1Download pack={activePack} />
            </div>
            
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 py-4">
              End of Briefing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPackCitySelector;