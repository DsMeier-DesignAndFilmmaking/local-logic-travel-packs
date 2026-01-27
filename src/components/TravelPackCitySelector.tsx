'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchTravelPack } from '@/lib/fetchTravelPack'; 
import { TravelPack } from '@/types/travel';
import PackCard from '@/components/PackCard';
import OfflineDownload from '@/components/OfflineDownload';

interface CitySuggestion {
  name: string;
  region: string;
  country: string;
  fullName: string;
}

const TravelPackCitySelector: React.FC<{ initialPack?: TravelPack | null }> = ({ initialPack }) => {
  const [city, setCity] = useState(initialPack?.city || '');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [travelPack, setTravelPack] = useState<TravelPack | null>(initialPack || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPack) setTravelPack(initialPack);
  }, [initialPack]);

  const fetchCities = async (query: string) => {
    if (!query) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data || []);
    } catch (err) { setSuggestions([]); }
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchCities(city), 250);
    return () => clearTimeout(handler);
  }, [city]);

  const handleSelect = async (selectedCity: string) => {
    setCity(selectedCity);
    setSuggestions([]);
    setLoading(true);
    
    // Call our async fetcher (the one that calls our /api/pack route)
    const pack = await fetchTravelPack(selectedCity);
    if (pack) {
      setTravelPack(pack);
    } else {
      setError("Pack not found.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      <div className="relative w-full mb-8">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        /> 
        
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={() => handleSelect(s.fullName)}
              >
                {s.fullName}
              </li>
            ))}
          </ul> 
        )}
      </div>

      {loading && <div className="text-center py-8">Loading...</div>}

      {travelPack && !loading && (
        <div className="space-y-6">
          <PackCard pack={travelPack} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Keeping your original OfflineDownload component here */}
            <OfflineDownload pack={travelPack} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPackCitySelector;