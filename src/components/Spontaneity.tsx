'use client';

import { useState, useMemo } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface SpontaneityProps {
  pack: TravelPack | null; // Allow null here
}

export default function Spontaneity({ pack }: SpontaneityProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [surpriseAction, setSurpriseAction] = useState<{ card: string; micro: string; action: string } | null>(null);

  // Use optional chaining so this doesn't crash on page load
  const tier4 = pack?.tiers?.tier4;

  const randomizedActionsMap = useMemo(() => {
    if (!tier4) return {};
    const map: Record<string, string[]> = {};
    tier4.cards.forEach((card, cardIndex) => {
      card.microSituations.forEach((micro, microIndex) => {
        const key = `${cardIndex}-${microIndex}`;
        map[key] = [...micro.actions].sort(() => Math.random() - 0.5);
      });
    });
    return map;
  }, [tier4, refreshKey]);

  const handleSurpriseMe = () => {
    if (!tier4) return;
    const allActions = tier4.cards.flatMap(card => 
      card.microSituations.flatMap(micro => 
        micro.actions.map(action => ({ 
          card: card.headline, 
          micro: micro.title, 
          action 
        }))
      )
    );
    setSurpriseAction(allActions[Math.floor(Math.random() * allActions.length)]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
      {/* 1. Header Section - Always Visible */}
      <div className="sm:px-0 mb-8">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Spontaneity & Moments
        </h3>
        <p className="text-sm sm:text-base font-medium text-slate-500 max-w-xl">
          Exploration ideas and AI-driven spontaneity for your travels.
        </p>
      </div>

      {/* 2. AI SPONTANEITY ENGINE PROMO - Always Visible */}
      <div className="sm:px-0 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                  Coming Soon
                </span>
              </div>
              <h4 className="text-2xl font-bold mb-3 tracking-tight">The Spontaneity Engine™</h4>
              <p className="text-slate-400 text-base leading-relaxed">
                I am in the process of building an AI system that generates hyper-local, real-time exploration paths based on your specific location and vibe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <button 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all active:scale-95 whitespace-nowrap shadow-sm"
                style={{ backgroundColor: '#E8FBF8', borderColor: '#B2E5DE', color: '#0D2D29' }}
                onClick={() => window.open('https://dan-meier-portfolio.vercel.app/projects/travel-and-ai/', '_blank')}
              >
                <span className="text-sm font-bold">Check out the system</span>
              </button>

              <button 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                onClick={() => window.open('https://yourwaitlist.com', '_blank')}
              >
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Conditional Content: Show City moments ONLY if tier4 exists */}
      {tier4 ? (
        <div className="animate-fadeIn">    
        </div>
      ) : (
        /* 4. Placeholder when no city is selected */
        <div className="sm:px-10 pb-20">
          <div className="p-10 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
            <p className="text-slate-400 font-medium max-w-xs">
            Select a destination to activate your offline support system.
            <br></br><br></br>
            Access real-time tactical info designed to resolve travel friction the moment it arises—no signal required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}