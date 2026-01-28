'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TravelPack } from '@/types/travel';
import { normalizeCityName } from '@/lib/cities';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import Spontaneity from '@/components/Spontaneity';

const TravelPackCitySelector: React.FC<{ initialPack?: TravelPack | null }> = ({ initialPack }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isStandalone, platform } = usePWAInstall();
  const [loading, setLoading] = useState(false);
  
  // Treat "installed single-city mode" as a MOBILE-only constraint.
  // On desktop, even if the PWA is installed, keep full browser behavior.
  const isMobileStandalone = isStandalone && (platform === 'ios' || platform === 'android');
  
  // Guard: Never auto-navigate when on root "/" route
  const isHome = pathname === '/';

  // If initial pack exists, navigate to its city page
  // GUARD: Only redirect when NOT on home - redirects only occur when user is already inside a city/pack flow
  // ESCAPE HATCH: Check for explicit user intent to go home - skip auto-navigation if flag is set
  useEffect(() => {
    // Check for explicit user intent to go home
    if (typeof window !== 'undefined') {
      const allowHome = localStorage.getItem('allowHome');
      if (allowHome === 'true') {
        // User explicitly clicked "Back to Home" - respect their intent, skip auto-navigation
        localStorage.removeItem('allowHome');
        return;
      }
    }
    
    // Only auto-navigate if initialPack exists and not on home
    if (initialPack && !isHome) {
      const normalizedCity = normalizeCityName(initialPack.city);
      router.push(`/packs/${normalizedCity}`);
    }
  }, [initialPack, router, isHome]);

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

  // In mobile standalone mode, disable city selector (single installed city pack UX)
  if (isMobileStandalone) {
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
  {/* Added pt-12 (mobile) and sm:pt-20 (desktop) */}
  <div className="pt-12 sm:pt-20 mb-10 sm:mb-16 text-center space-y-3">
    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 border border-slate-200">
      Beta Access
    </div>
    
    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight text-behavior leading-[1.1]">
    Expert Solutions for <span className="text-emerald-500">On-the-Spot Travel Snags.</span>
    </h1>
    
    <p className="max-w-xl mx-auto text-slate-500 text-sm sm:text-lg font-medium leading-relaxed">
    Stop scrolling through blogs and guessing on the fly. Unlock zero-latency city packs designed to solve real-time travel friction—from transit hacks to local etiquette—all 100% offline.
    </p>
    
    <div className="pt-4 flex justify-center gap-2">
      <div className="h-1 w-12 bg-emerald-500 rounded-full" />
      
    </div>
  </div>
  
    {!loading && (
      <div className="animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
        <Spontaneity onCitySelect={handleSelect} />
      </div>
    )}
  </div>
  );
};

export default TravelPackCitySelector;