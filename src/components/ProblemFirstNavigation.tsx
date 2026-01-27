'use client';

import { useState } from 'react';
import { TravelPack } from '@/types/travel';
import MicroSituationView from './MicroSituationView';

interface ProblemFirstNavigationProps {
  pack: TravelPack;
}

export default function ProblemFirstNavigation({ pack }: ProblemFirstNavigationProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedMicroSituationIndex, setSelectedMicroSituationIndex] = useState<number | null>(null);

  const tier1 = pack.tiers?.tier1;

  if (!tier1 || !tier1.cards || tier1.cards.length === 0) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--text-on-dark)' }}>
        <p>No problem-first content available for this city.</p>
      </div>
    );
  }

  // If a card is selected, show micro-situations
  if (selectedCardIndex !== null) {
    const selectedCard = tier1.cards[selectedCardIndex];
    
    // If a micro-situation is selected, show actions
    if (selectedMicroSituationIndex !== null) {
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

    // Show micro-situations for selected card - Large tappable buttons
    return (
      <div className="space-y-6">
        <button
        onClick={() => {
          setSelectedCardIndex(null);
          setSelectedMicroSituationIndex(null);
        }}
        /* pt-4: Added top padding for better vertical spacing
          px-6 sm:px-10: Standardized horizontal alignment
          mb-6: Bottom margin to separate from the content below
        */
        className="pt-4 px-6 sm:px-10 mb-6 flex items-center gap-3 text-sm sm:text-base font-bold transition-all hover:opacity-80 group touch-manipulation" style={{ color: 'var(--text-on-light)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Back to Categories</span>
      </button>
        
        <div className="mb-6 px-6 sm:px-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-on-light)' }}>
            {selectedCard.headline}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-on-dark-muted)' }}>
            Choose a situation to get specific help
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 sm:px-10 pb-10">
          {selectedCard.microSituations.map((microSituation, index) => (
            <button
            key={index}
            onClick={() => setSelectedMicroSituationIndex(index)}
            /* MATCHING TIER 1 STYLES: 
               - border-slate-200/60 hairline
               - group hover with blue text shift
               - rounded-3xl and hover:translate-y
            */
            className="group w-full text-left p-6 sm:p-8 rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 active:scale-[0.98] touch-manipulation"
            style={{ minHeight: '100px' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg sm:text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                    {microSituation.title}
                  </h3>
                  {microSituation.actions.length > 0 && (
                    <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                      {microSituation.actions.length} action{microSituation.actions.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: '#6b7280' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show main problem cards - Streamlined, typography-focused UI
  return (
    <div className="space-y-8 py-10">
      <div className="px-6 sm:px-10">
        
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Tap a category for immediate assistance. All guides work 100% offline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 sm:px-10">
        {tier1.cards.map((card, index) => (
          <button
            key={index}
            onClick={() => setSelectedCardIndex(index)}
            className="group w-full text-left p-6 sm:p-8 rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 active:scale-[0.98] touch-manipulation"
            style={{ minHeight: '120px' }}
          >
            <div className="flex flex-col justify-center h-full">
              <div className="flex items-center gap-3 mb-2">
                {/* Status indicator remains as a subtle functional cue */}
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 transition-colors group-hover:text-blue-600">
                  {card.headline}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">
                  {card.microSituations.length} Scenarios
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <p className="text-sm sm:text-base font-medium text-slate-500">
                  Ready for offline use
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
