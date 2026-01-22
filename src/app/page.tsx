'use client';

import { useState, useEffect } from 'react';
import CityInput from '@/components/CityInput';
import PackCard from '@/components/PackCard';
import OfflineDownload from '@/components/OfflineDownload';
import { OfflineTravelPack } from '@/types';
import { sortTravelInsights } from '@/lib/sortTravelInsights';
import { transformInsightsToUIPack } from '@/lib/transformTravelInsights';
import { fetchTravelPackForCity } from '@/lib/fetchTravelPack';
import { TravelInsight } from '@/lib/travelPackSchema';

export default function Home() {
  const [city, setCity] = useState('');
  const [pack, setPack] = useState<OfflineTravelPack | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with Paris pack
  useEffect(() => {
    const parisInsights = fetchTravelPackForCity('Paris');
    const sortedInsights = sortTravelInsights(parisInsights);
    const uiPack = transformInsightsToUIPack(
      'Paris',
      '1.0',
      '2024-01-22T10:00:00Z',
      'A 3-5 day cultural immersion in Paris, focusing on authentic experiences beyond the tourist traps. Perfect for first-time visitors who want to feel like they\'re discovering the real city.',
      sortedInsights
    );
    setPack(uiPack);
  }, []);

  const handlePackSelect = (insights: TravelInsight[]) => {
    setIsLoading(true);
    
    // Extract city name from full city string
    const cityName = city.split(',')[0].trim() || 'Paris';
    
    setTimeout(() => {
      const sortedInsights = sortTravelInsights(insights);
      const uiPack = transformInsightsToUIPack(
        cityName,
        '1.0',
        new Date().toISOString(),
        `A curated travel pack for ${cityName}, focusing on authentic experiences beyond the tourist traps.`,
        sortedInsights
      );
      setPack(uiPack);
      setIsLoading(false);
    }, 300);
  };

  const handleGetTravelPack = () => {
    if (!city.trim()) return;
    
    setIsLoading(true);
    
    // Fetch travel pack for entered city (falls back to Paris if unknown)
    const insights = fetchTravelPackForCity(city);
    handlePackSelect(insights);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Local Logic Travel Packs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Curated, opinionated travel guides designed for offline use. Get the essential information you need without the tourist traps.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">✓</span>
              <span>Designed for offline use</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">✓</span>
              <span>Avoids tourist traps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">✓</span>
              <span>Built for fast decisions while traveling</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="mb-4">
            <CityInput
              value={city}
              onChange={setCity}
              placeholder="Enter a city name..."
              onPackSelect={handlePackSelect}
            />
          </div>
          
          <button
            onClick={handleGetTravelPack}
            disabled={isLoading || !city.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Loading...' : 'Get Travel Pack'}
          </button>
        </div>

        {pack && (
          <div className="space-y-6">
            <PackCard pack={pack} />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <OfflineDownload pack={pack} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
