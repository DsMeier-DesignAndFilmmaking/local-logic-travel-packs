'use client';

import { useState, useMemo } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface SpontaneityProps {
  pack: TravelPack;
}

/**
 * Spontaneity / Moments Section
 * Optional, playful section for offline exploration using Tier 4 data
 * Randomizes actions for spontaneity
 */
export default function Spontaneity({ pack }: SpontaneityProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tier4 = pack.tiers?.tier4;

  if (!tier4 || !tier4.cards || tier4.cards.length === 0) {
    return null;
  }

  /**
   * Randomize actions for a micro-situation
   * Shuffles the actions array to provide variety
   */
  const randomizeActions = (actions: string[]): string[] => {
    const shuffled = [...actions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Memoize randomized actions per micro-situation
   * Uses refreshKey to allow re-randomization when needed
   */
  const randomizedActionsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    tier4.cards.forEach((card, cardIndex) => {
      card.microSituations.forEach((micro, microIndex) => {
        const key = `${cardIndex}-${microIndex}`;
        map[key] = randomizeActions(micro.actions);
      });
    });
    return map;
  }, [tier4, refreshKey]);

  /**
   * Get a random action from all available actions
   * Used for the "Surprise Me" feature
   */
  const getRandomAction = (): { card: string; micro: string; action: string } | null => {
    const allActions: Array<{ card: string; micro: string; action: string }> = [];
    
    tier4.cards.forEach((card) => {
      card.microSituations.forEach((micro) => {
        micro.actions.forEach((action) => {
          allActions.push({
            card: card.headline,
            micro: micro.title,
            action,
          });
        });
      });
    });

    if (allActions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allActions.length);
    return allActions[randomIndex];
  };

  const [surpriseAction, setSurpriseAction] = useState<{ card: string; micro: string; action: string } | null>(null);

  const handleSurpriseMe = () => {
    const random = getRandomAction();
    setSurpriseAction(random);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
          🎲 Spontaneity & Moments
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Optional exploration ideas for when you have free time. All content works offline.
        </p>
      </div>

      {/* Surprise Me Button */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleSurpriseMe}
          className="flex-1 sm:flex-none px-6 py-4 rounded-xl border-2 transition-all transform active:scale-[0.98] touch-manipulation font-semibold text-lg"
          style={{
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FDE68A';
            e.currentTarget.style.boxShadow = '0 8px 12px rgba(245, 158, 11, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF3C7';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(245, 158, 11, 0.2)';
          }}
        >
          🎲 Surprise Me
        </button>
        {isExpanded && (
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="px-4 py-4 rounded-xl border-2 transition-all transform active:scale-[0.98] touch-manipulation text-sm font-medium"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              color: '#1A1A1A',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            🔄 Re-randomize
          </button>
        )}
      </div>

      {/* Surprise Action Display */}
      {surpriseAction && (
        <div
          className="mb-6 p-5 rounded-xl border-2 animate-pulse"
          style={{
            backgroundColor: '#FFFBEB',
            borderColor: '#F59E0B',
          }}
        >
          <div className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>
            {surpriseAction.card} • {surpriseAction.micro}
          </div>
          <div className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
            {surpriseAction.action}
          </div>
        </div>
      )}

      {/* Collapsible Cards */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors mb-4"
        style={{
          backgroundColor: isExpanded ? '#F0FDF4' : '#FFFFFF',
          borderColor: isExpanded ? '#10B981' : '#E5E7EB',
        }}
      >
        <span className="font-semibold text-base sm:text-lg" style={{ color: '#1A1A1A' }}>
          {isExpanded ? '▼' : '▶'} {tier4.title}
        </span>
        <span className="text-sm text-gray-600">
          {tier4.cards.length} card{tier4.cards.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4 animate-fadeIn">
          {tier4.cards.map((card, cardIndex) => (
            <div
              key={cardIndex}
              className="p-5 sm:p-6 rounded-xl border-2"
              style={{
                backgroundColor: '#FFFBEB',
                borderColor: '#FCD34D',
              }}
            >
              <h4 className="text-lg sm:text-xl font-bold mb-4" style={{ color: '#92400E' }}>
                {card.headline}
              </h4>
              
              <div className="space-y-4">
                {card.microSituations.map((micro, microIndex) => {
                  const key = `${cardIndex}-${microIndex}`;
                  const randomized = randomizedActionsMap[key] || micro.actions;
                  
                  return (
                    <div
                      key={microIndex}
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderLeft: '4px solid #F59E0B',
                      }}
                    >
                      <h5 className="font-semibold text-base mb-3" style={{ color: '#1A1A1A' }}>
                        {micro.title}
                      </h5>
                      <ul className="space-y-2">
                        {randomized.map((action, actionIndex) => (
                          <li
                            key={actionIndex}
                            className="flex items-start gap-3 text-sm sm:text-base"
                            style={{ color: '#1A1A1A' }}
                          >
                            <span className="text-yellow-600 font-bold mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span className="leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
