'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface Props {
  initialPack?: TravelPack | null;
}

const TravelPackCitySelector: React.FC<Props> = ({ initialPack }) => {
  const [cityInput, setCityInput] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [activePack, setActivePack] = useState<TravelPack | null>(initialPack || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if a pack is recovered from the parent
  useEffect(() => {
    if (initialPack) {
      setActivePack(initialPack);
      setCityInput(initialPack.city);
    }
  }, [initialPack]);

  const fetchCities = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const unique = data.filter((v: any, i: number, a: any[]) => 
          a.findIndex(t => t.fullName === v.fullName) === i
        );
        setSuggestions(unique);
      }
    } catch (err) {
      console.error('City API error:', err);
    }
  };

  const handleSelect = async (selectedFullName: string) => {
    // 1. USE THE IMPORT HERE
    const normalizedName = normalizeCityName(selectedFullName);
    
    setCityInput(selectedFullName);
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      // 2. Pass the normalized name to ensure it matches your JSON/DB keys
      const pack = fetchTravelPack(normalizedName); 
      
      if (!pack) {
        // We use the split logic only for the error message display
        setError(`Tactical intelligence for ${selectedFullName.split(',')[0]} is restricted.`);
        setActivePack(null);
      } else {
        setActivePack(pack);
      }
    } catch (err) {
      setError('System error retrieving tactical data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // Don't search if the input matches our currently active city
      if (cityInput !== activePack?.city) {
        fetchCities(cityInput);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [cityInput, activePack]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Tactical Search Input */}
      <div className="relative mb-8" ref={containerRef}>
        <div className="relative group">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Search Target City..."
            className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all shadow-sm"
          />
          {activePack && (
            <button 
              onClick={() => { setActivePack(null); setCityInput(''); }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest"
            >
              Clear
            </button>
          )}
        </div>
        
        {suggestions.length > 0 && (
          <div className="absolute z-[100] mt-2 w-full bg-white border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.fullName}-${idx}`}
                className="w-full px-6 py-4 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                onClick={() => handleSelect(s.fullName)}
              >
                <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{s.name}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.region}, {s.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Asset...</p>
        </div>
      )}

      {activePack && !loading && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <PackCard pack={activePack} />
          <Tier1Download pack={activePack} />
        </div>
      )}
      
      {error && !loading && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-center">
          <p className="text-rose-600 font-bold text-sm uppercase tracking-tight">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TravelPackCitySelector;