'use client';

import { useState } from 'react';
import { TravelPack } from '@/types/travel';

export default function TacticalIntelligence({ pack }: { pack: TravelPack }) {
  const [openTier, setOpenTier] = useState<string | null>('briefing');

  const intelligenceFallback = 'Intelligence not yet secured';

  const tiers = [
    {
      id: 'arrival-transit',
      label: '01. ARRIVAL_&_TRANSIT',
      field: pack.transit ?? intelligenceFallback,
    },
    {
      id: 'local-protocol',
      label: '02. LOCAL_PROTOCOL',
      field: pack.protocol ?? intelligenceFallback,
    },
    {
      id: 'logistics-utility',
      label: '03. LOGISTICS_&_UTILITY',
      field: pack.utility ?? intelligenceFallback,
    },
    {
      id: 'frictionless-dining',
      label: '04. FRICTIONLESS_DINING',
      field: pack.dining ?? intelligenceFallback,
    },
  ];

  return (
    <div className="space-y-2 mt-8">
      {tiers.map((tier) => (
        <div key={tier.id} className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenTier(openTier === tier.id ? null : tier.id)}
            className="w-full p-4 flex justify-between items-center bg-slate-900/50 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-widest text-slate-400">
                {tier.label}
              </span>
              <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/5">
                SAFE_DATA
              </span>
            </div>
            <span className="text-emerald-500 font-mono text-sm">
              {openTier === tier.id ? '−' : '+'}
            </span>
          </button>
          
          {openTier === tier.id && (
            <div className="p-4 bg-slate-950 text-slate-300 text-sm leading-relaxed border-t border-slate-800 animate-in fade-in slide-in-from-top-1">
              <p className="whitespace-pre-line font-sans">
                {tier.field}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}