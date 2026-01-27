'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/types/travel';
import MicroSituationView from './MicroSituationView';

interface ProblemFirstNavigationProps {
  pack: TravelPack;
}

export default function ProblemFirstNavigation({ pack }: ProblemFirstNavigationProps) {
  // Ensure we start with null for a collapsed "Vault" view
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedMicroSituationIndex, setSelectedMicroSituationIndex] = useState<number | null>(null);

  // LOGIC FIX: Reset view if the city changes to prevent "Arrival & Safety" 
  // from staying open from a previous pack load.
  useEffect(() => {
    setSelectedCardIndex(null);
    setSelectedMicroSituationIndex(null);
  }, [pack.city]);

  const tier1 = pack.tiers?.tier1;

  if (!tier1 || !tier1.cards || tier1.cards.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>No tactical content available for this sector.</p>
      </div>
    );
  }

  // View 3: Micro-Situation Action View (Detailed Help)
  if (selectedCardIndex !== null && selectedMicroSituationIndex !== null) {
    const selectedCard = tier1.cards[selectedCardIndex];
    const selectedMicroSituation = selectedCard.microSituations[selectedMicroSituationIndex];
    return (
      <MicroSituationView
        cardHeadline={selectedCard.headline}
        microSituation={selectedMicroSituation}
        onBack={() => setSelectedMicroSituationIndex(null)}
        onHome={() => {
          setSelectedCardIndex(null);
          setSelectedMicroSituationIndex(null);
        }}
      />
    );
  }

  // View 2: List of Micro-Situations (Sub-Categories)
  if (selectedCardIndex !== null) {
    const selectedCard = tier1.cards[selectedCardIndex];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setSelectedCardIndex(null)}
          className="pt-4 px-6 sm:px-10 mb-2 flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>Return to Vault</span>
        </button>
        
        <div className="mb-6 px-6 sm:px-10">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {selectedCard.headline}
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Select a situation for immediate deployment.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 sm:px-10 pb-10">
          {selectedCard.microSituations.map((ms, index) => (
            <button
              key={index}
              onClick={() => setSelectedMicroSituationIndex(index)}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{ms.title}</span>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // View 1: Main Category List (THE STARTING POINT)
  return (
    <div className="space-y-8 py-10 animate-in fade-in duration-500">
      <div className="px-6 sm:px-10 flex items-center justify-between">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">
            Intel Categories
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Verified for 100% Offline Connectivity
          </p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase">System Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 sm:px-10">
        {tier1.cards.map((card, index) => (
          <button
            key={index}
            onClick={() => setSelectedCardIndex(index)}
            className="group w-full text-left p-6 sm:p-8 rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] touch-manipulation"
          >
            <div className="flex flex-col justify-center h-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                  {card.headline}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {card.microSituations.length} Scenarios
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                  Encrypted Offline
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}