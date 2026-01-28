'use client';

import React, { useState } from 'react';
import { TravelPack, ProblemCard, MicroSituation, TravelPackTier } from '@/types/travel';
// Ensure this path matches the location of your OfflineDownload file
import OfflineDownload from './OfflineDownload'; 
import VaultDebugger from '@/components/debug/VaultDebugger'; // Adjust path based on your folder structure

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
    <div className="bg-white border-2 border-slate-100 rounded-[24px] overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 min-h-[44px] flex items-center justify-between bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 text-left">
          <div className={`w-8 h-8 rounded-lg ${tierColor} flex items-center justify-center text-white text-[10px] font-black shadow-inner`}>
            0{tierNumber}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
              {tierLabel}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tier.title}</p>
          </div>
        </div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-200' : ''}`}>
          <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 sm:px-6 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {tier.cards.map((card: ProblemCard, cardIdx: number) => (
            <div
              key={`tier${tierNumber}-card-${cardIdx}`}
              className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200"
            >
              <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 mb-4 border-b border-slate-200 pb-2">
                {card.headline}
              </h4>
              
              <div className="space-y-6">
                {card.microSituations.map((situation: MicroSituation, sIdx: number) => (
                  <div key={`tier${tierNumber}-situation-${sIdx}`} className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                      Scenario: {situation.title}
                    </h5>
                    <ul className="space-y-3">
                      {situation.actions.map((action, aIdx) => (
                        <li key={aIdx} className="flex gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                          <span className="text-emerald-500 font-black flex-shrink-0">›</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
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
  const [openTiers, setOpenTiers] = useState<Set<number>>(new Set()); 

  if (!pack || !pack.tiers) return null;

  const toggleTier = (tierNumber: number) => {
    setOpenTiers(prev => {
      const next = new Set(prev);
      if (next.has(tierNumber)) next.delete(tierNumber);
      else next.add(tierNumber);
      return next;
    });
  };

  const allTiers = [
    { tier: pack.tiers.tier1, number: 1 as const, label: 'Arrival & Safety', color: 'bg-red-500' },
    pack.tiers.tier2 && { tier: pack.tiers.tier2, number: 2 as const, label: 'Logistics', color: 'bg-blue-500' },
    pack.tiers.tier3 && { tier: pack.tiers.tier3, number: 3 as const, label: 'Social & Cultural', color: 'bg-purple-500' },
    pack.tiers.tier4 && { tier: pack.tiers.tier4, number: 4 as const, label: 'Hidden Gems', color: 'bg-emerald-500' },
  ].filter((t): t is { tier: TravelPackTier; number: 1 | 2 | 3 | 4; label: string; color: string } => 
    !!t && !!t.tier && !!t.tier.cards && t.tier.cards.length > 0
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-12">
      {/* Tactical Header */}
      <div className="bg-slate-900 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
                Encrypted Intel Vault
              </span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter mb-1 leading-none">
            {pack.city}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            {pack.country} • {allTiers.length} Sectors Active
          </p>
        </div>
        
        <div className="absolute right-[-5%] top-[-10%] text-[120px] font-black text-white/[0.04] italic pointer-events-none select-none uppercase">
          {pack.city.substring(0, 3)}
        </div>
      </div>

      {/* --- OFFLINE SYNC SECTION --- */}
      {/* This is the missing link. It forces the cache and DB to sync */}
      <div className="px-1">
        <OfflineDownload pack={pack} />
      </div>
      {/* Only show debugger in development or for testing */}
    {process.env.NODE_ENV === 'development' && (
      <VaultDebugger city={pack.city} />
    )}

      {/* Tier Sections */}
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

      {/* Vault Metadata Footer */}
      <div className="text-center pt-4">
        <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {pack.offlineReady ? (
              <span className="text-emerald-600">✓ Local Hardware Instance • Verified For Flight</span>
            ) : (
              <span>Cloud Instance • Use Sync To Enable Offline Access</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PackCard;