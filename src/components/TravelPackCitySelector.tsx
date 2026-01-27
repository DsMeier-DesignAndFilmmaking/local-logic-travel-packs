'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TravelPack } from '@/types/travel';
import { normalizeCityName } from '@/lib/cities';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import Spontaneity from '@/components/Spontaneity';

const TravelPackCitySelector: React.FC<{ initialPack?: TravelPack | null }> = ({ initialPack }) => {
  const router = useRouter();
  const { isStandalone } = usePWAInstall();
  const [loading, setLoading] = useState(false);

  // If initial pack exists, navigate to its city page
  useEffect(() => {
    if (initialPack) {
      const normalizedCity = normalizeCityName(initialPack.city);
      router.push(`/packs/${normalizedCity}`);
    }
  }, [initialPack, router]);

  const handleSelect = async (selectedCity: string) => {
    setLoading(true);
    
    try {
      // Normalize city name and navigate to city pack page
      // The city pack page will handle loading the pack and injecting the manifest
      const normalizedCity = normalizeCityName(selectedCity);
      router.push(`/packs/${normalizedCity}`);
    } catch (error) {
      console.error('Failed to navigate to pack:', error);
      setLoading(false);
    }
  };

  // In standalone mode, disable city selector
  if (isStandalone) {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Travel Intel</h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              City selection is disabled in installed app mode. This app shows only the installed city pack.
            </p>
          </div>
        </div>
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-sm text-center">
            📱 This is an installed city pack app. To access other cities, please visit the main website.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header logic - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Travel Intel</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Select a destination to unlock tactical insights.</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Spontaneity onCitySelect={handleSelect} />
        </div>
      )}
    </div>
  );
};

export default TravelPackCitySelector;