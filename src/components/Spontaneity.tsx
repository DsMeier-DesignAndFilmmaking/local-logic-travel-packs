'use client';

import React from 'react';
import { SUPPORTED_CITIES } from '@/lib/cities';

interface SpontaneityProps {
  onCitySelect: (cityName: string) => void;
}

const Spontaneity: React.FC<SpontaneityProps> = ({ onCitySelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
      {SUPPORTED_CITIES.map((cityName) => (
        <button
          key={cityName}
          onClick={() => onCitySelect(cityName)}
          className="flex items-center justify-center px-3 sm:px-4 py-3 sm:py-4 min-h-[44px] bg-white hover:bg-gray-50 text-gray-900 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl transition-all border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-95"
        >
          <span className="text-center leading-tight">{cityName}</span>
        </button>
      ))}
    </div>
  );
};

export default Spontaneity;