'use client';

import { useState } from 'react';
import { TravelPack } from '@/lib/travelPacks';
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
          className="mb-4 flex items-center gap-2 text-sm sm:text-base font-medium hover:underline touch-manipulation"
          style={{ color: 'var(--text-on-dark)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Problems
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-on-dark)' }}>
            {selectedCard.headline}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-on-dark-muted)' }}>
            Choose a situation to get specific help
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {selectedCard.microSituations.map((microSituation, index) => (
            <button
              key={index}
              onClick={() => setSelectedMicroSituationIndex(index)}
              className="w-full text-left p-5 sm:p-6 rounded-xl border-2 transition-all transform active:scale-[0.98] touch-manipulation"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'var(--border-light)',
                minHeight: '80px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0FDF4';
                e.currentTarget.style.borderColor = 'var(--accent-green)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = '#F0FDF4';
                e.currentTarget.style.borderColor = 'var(--accent-green)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.15)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
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

  // Show main problem cards - Large, tappable cards for offline-first UX
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--text-on-dark)' }}>
          What do you need right now?
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-on-dark-muted)' }}>
          Tap a card to get immediate help. All content works offline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {tier1.cards.map((card, index) => (
          <button
            key={index}
            onClick={() => setSelectedCardIndex(index)}
            className="w-full text-left p-6 sm:p-8 rounded-xl border-2 transition-all transform active:scale-[0.98] touch-manipulation"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'var(--border-light)',
              minHeight: '140px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-green)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.backgroundColor = '#F0FDF4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-green)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.backgroundColor = '#F0FDF4';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {card.headline}
                </h3>
                <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                  {card.microSituations.length} situation{card.microSituations.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg 
                  className="w-6 h-6 sm:w-8 sm:h-8" 
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
