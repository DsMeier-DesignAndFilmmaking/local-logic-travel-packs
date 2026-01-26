'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface SpontaneityProps {
  pack: TravelPack | null;
}

export default function Spontaneity({ pack }: SpontaneityProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only allow this component to show if after 500ms 
    // there is still no pack loaded. This prevents the "flash".
    const timer = setTimeout(() => {
      if (!pack) {
        setShouldRender(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pack]);

  // 1. HARD GATE: If a pack exists, never show.
  if (pack && pack.city) return null;

  // 2. DELAYED GATE: Don't show anything until we are sure no pack is coming.
  if (!shouldRender) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10 animate-in fade-in duration-700">
       {/* ... rest of your Spontaneity UI code ... */}
       <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Spontaneity & Moments</h3>
       <p>Select a destination above to activate your vault.</p>
    </div>
  );
}