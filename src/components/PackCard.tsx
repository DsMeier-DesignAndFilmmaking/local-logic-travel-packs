'use client';

import React from 'react';
import { TravelPack, ProblemCard, MicroSituation } from '@/lib/travelPacks';

interface PackCardProps {
  pack: TravelPack;
}

const PackCard: React.FC<PackCardProps> = ({ pack }) => {
  // We prioritize Tier 1 (Arrival/Tactical) as the main view
  const tier1 = pack.tiers?.tier1;

  return (
    <div className="w-full space-y-6">
      {/* 1. Tactical Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              Active Vault Asset
            </span>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-1">
            {pack.city}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {pack.country} • Intelligence Tier 1
          </p>
        </div>
        
        {/* Background Visual Element */}
        <div className="absolute right-[-10%] top-[-20%] text-[120px] font-black text-white/[0.03] italic pointer-events-none select-none">
          {pack.city.substring(0, 3)}
        </div>
      </div>

      {/* 2. Tactical Cards (The "Must Know" content) */}
      <div className="grid gap-4">
        {tier1?.cards.map((card: ProblemCard, cardIdx: number) => (
          <div 
            key={`${card.headline}-${cardIdx}`}
            className="bg-white border-2 border-slate-100 rounded-[24px] p-6 shadow-sm hover:border-slate-900 transition-colors group"
          >
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center justify-between">
              {card.headline}
              <span className="text-slate-200 group-hover:text-slate-900 transition-colors">→</span>
            </h3>
            
            <div className="space-y-4">
              {card.microSituations.map((situation: MicroSituation, sIdx: number) => (
                <div key={`${situation.title}-${sIdx}`} className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Situation: {situation.title}
                  </h4>
                  <ul className="space-y-2">
                    {situation.actions.map((action, aIdx) => (
                      <li key={aIdx} className="flex gap-3 text-sm font-medium text-slate-600">
                        <span className="text-slate-900 font-bold">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                  {situation.whatToDoInstead && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border-l-4 border-slate-900">
                      <p className="text-[11px] font-bold text-slate-900">
                        PRO-TIP: {situation.whatToDoInstead}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Vault Metadata */}
      <div className="text-center pt-4">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Downloaded: {new Date(pack.downloadedAt || '').toLocaleDateString()} • Offline Ready
        </p>
      </div>
    </div>
  );
};

export default PackCard;