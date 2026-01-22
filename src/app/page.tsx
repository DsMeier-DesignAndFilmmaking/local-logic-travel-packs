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
  const [error, setError] = useState<string | null>(null);

  // Initialize with Paris pack on mount
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

  // Auto-fetch Travel Pack whenever city changes from selection
  useEffect(() => {
    if (!city || !city.trim()) {
      setPack(null);
      setError(null);
      return;
    }

    const fetchPack = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract city name from full city string (e.g., "Paris, Île-de-France, France" -> "Paris")
        const cityName = city.split(',')[0].trim() || city.trim();

        // Fetch travel pack for selected city (falls back to Paris if unknown)
        const insights = fetchTravelPackForCity(city);

        if (!insights || insights.length === 0) {
          setError('Travel Pack unavailable for this city.');
          setPack(null);
          return;
        }

        // Sort insights by priority score
        const sortedInsights = sortTravelInsights(insights);

        // Transform to UI format (includes all Tier 1-3 content)
        const uiPack = transformInsightsToUIPack(
          cityName,
          '1.0',
          new Date().toISOString(),
          `A curated travel pack for ${cityName}, focusing on authentic experiences beyond the tourist traps.`,
          sortedInsights
        );

        setPack(uiPack);
        setError(null);
      } catch (err) {
        console.error('Error loading Travel Pack:', err);
        setError('Error loading Travel Pack.');
        setPack(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure city selection is complete
    const timeoutId = setTimeout(fetchPack, 100);
    return () => clearTimeout(timeoutId);
  }, [city]);

  const handlePackSelect = (insights: TravelInsight[]) => {
    // This callback is triggered by CityInput when a suggestion is selected
    // The useEffect above will handle the pack loading automatically
    // This is kept for compatibility but the main logic is in useEffect
  };

  const handleGetTravelPack = () => {
    // Manual trigger - same as auto-load, but allows user to refresh
    if (!city.trim()) return;
    // The useEffect will handle this automatically
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
          
          {/* Loading state */}
          {isLoading && (
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              <p>Loading Travel Pack...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Optional: Keep button as manual refresh option */}
          <button
            onClick={handleGetTravelPack}
            disabled={isLoading || !city.trim()}
            className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Loading...' : 'Refresh Travel Pack'}
          </button>
        </div>

        {/* Travel Pack Display - Auto-loaded when city is selected */}
        {pack && !isLoading && (
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
