'use client';

import { useState } from 'react';
import CityInput from '@/components/CityInput';
import PackCard from '@/components/PackCard';
import OfflineDownload from '@/components/OfflineDownload';
import { SimplePack } from '@/types';
import examplePackData from '@/data/examplePack.json';

export default function Home() {
  const [city, setCity] = useState('');
  const [pack, setPack] = useState<SimplePack | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetTravelPack = () => {
    setIsLoading(true);
    
    // Simulate fetching (in a real app, this would be an API call)
    setTimeout(() => {
      // For now, always return the example pack
      setPack(examplePackData as SimplePack);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Local Logic Travel Packs
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="mb-4">
            <CityInput
              value={city}
              onChange={setCity}
              placeholder="Enter a city name..."
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
