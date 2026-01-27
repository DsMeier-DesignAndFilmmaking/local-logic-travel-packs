'use client';

import React, { useState } from 'react';
import { TravelPack, ProblemCard, MicroSituation, TravelPackTier } from '@/types/travel';

interface PackCardProps {
  pack: TravelPack;
}

interface TierSectionProps {
  tier: TravelPackTier;
  tierNumber: 1 | 2 | 3 | 4;
  tierLabel: string;
  tierColor: string;
  isOpen: boolean;
  onToggle: () => void;
}

const TierSection: React.FC<TierSectionProps> = ({ tier, tierNumber, tierLabel, tierColor, isOpen, onToggle }) => {
  if (!tier || !tier.cards || tier.cards.length === 0) return null;

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
      {/* Tier Header - Mobile Optimized (44px min height) */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 min-h-[44px] flex items-center justify-between bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${tierColor} flex-shrink-0`} />
          <div className="text-left">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
              Tier {tierNumber}: {tierLabel}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">{tier.title}</p>
          </div>
        </div>
        <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Tier Content */}
      {isOpen && (
        <div className="px-4 sm:px-6 pb-6 pt-2 space-y-4">
          {tier.cards.map((card: ProblemCard, cardIdx: number) => (
            <div
              key={`tier${tierNumber}-card-${cardIdx}`}
              className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200"
            >
              <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 mb-4">
                {card.headline}
              </h4>
              
              <div className="space-y-4">
                {card.microSituations.map((situation: MicroSituation, sIdx: number) => (
                  <div key={`tier${tierNumber}-situation-${sIdx}`} className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {situation.title}
                    </h5>
                    <ul className="space-y-2">
                      {situation.actions.map((action, aIdx) => (
                        <li key={aIdx} className="flex gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                          <span className="text-slate-900 font-bold flex-shrink-0">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    {situation.whatToDoInstead && (
                      <div className="mt-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                        <p className="text-[11px] font-bold text-emerald-900">
                          💡 PRO-TIP: {situation.whatToDoInstead}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PackCard: React.FC<PackCardProps> = ({ pack }) => {
  const [openTiers, setOpenTiers] = useState<Set<number>>(new Set([1])); // Tier 1 open by default

  // Defensive check: if no pack or tiers exist, return null or a loader
  if (!pack || !pack.tiers) return null;

  const toggleTier = (tierNumber: number) => {
    setOpenTiers(prev => {
      const next = new Set(prev);
      if (next.has(tierNumber)) {
        next.delete(tierNumber);
      } else {
        next.add(tierNumber);
      }
      return next;
    });
  };

  // Build tiers array with type safety - only include defined tiers
  const allTiers = [
    { tier: pack.tiers.tier1, number: 1 as const, label: 'Arrival & Safety', color: 'bg-red-500' },
    pack.tiers.tier2 && { tier: pack.tiers.tier2, number: 2 as const, label: 'Logistics', color: 'bg-blue-500' },
    pack.tiers.tier3 && { tier: pack.tiers.tier3, number: 3 as const, label: 'Social & Cultural', color: 'bg-purple-500' },
    pack.tiers.tier4 && { tier: pack.tiers.tier4, number: 4 as const, label: 'Hidden Gems', color: 'bg-emerald-500' },
  ].filter((t): t is { tier: TravelPackTier; number: 1 | 2 | 3 | 4; label: string; color: string } => 
    t !== null && t !== undefined && t.tier !== undefined
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* 1. Tactical Header - Mobile Optimized */}
      <div className="bg-slate-900 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              Active Vault Asset
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-1">
            {pack.city}
          </h2>
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
            {pack.country} • {allTiers.length} Intelligence Tiers Available
          </p>
        </div>
        
        {/* Background Visual Element */}
        <div className="absolute right-[-10%] top-[-20%] text-[100px] sm:text-[120px] font-black text-white/[0.03] italic pointer-events-none select-none">
          {pack.city.substring(0, 3)}
        </div>
      </div>

      {/* 2. Tier Sections - Collapsible */}
      <div className="space-y-3 sm:space-y-4">
        {allTiers.map(({ tier, number, label, color }) => (
          <TierSection
            key={`tier-${number}`}
            tier={tier}
            tierNumber={number}
            tierLabel={label}
            tierColor={color}
            isOpen={openTiers.has(number)}
            onToggle={() => toggleTier(number)}
          />
        ))}
      </div>

      {/* 3. Vault Metadata */}
      <div className="text-center pt-2 sm:pt-4">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          {pack.downloadedAt ? (
            <>Downloaded: {new Date(pack.downloadedAt).toLocaleDateString()} • Offline Ready</>
          ) : (
            <>Online Preview • Download for Offline Access</>
          )}
        </p>
      </div>
    </div>
  );
};

export default PackCard;