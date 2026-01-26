'use client';

import { useState } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface SpontaneityProps {
  pack: TravelPack | null;
}

export default function Spontaneity({ pack }: SpontaneityProps) {
  // IF A PACK EXISTS: We don't want the "Select a destination" placeholder
  // or the "Spontaneity & Moments" title repeating inside the vault.
  if (pack) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10">
      <div className="mb-8">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Spontaneity & Moments
        </h3>
        <p className="text-sm font-medium text-slate-500 max-w-xl">
          Exploration ideas and AI-driven spontaneity for your travels.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-2xl mb-8">
        <h4 className="text-2xl font-bold mb-3 tracking-tight">The Spontaneity Engine™</h4>
        <p className="text-slate-400 text-base leading-relaxed mb-6">
          I am in the process of building an AI system that generates hyper-local, real-time exploration.
        </p>
        <button 
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold"
          onClick={() => window.open('https://yourwaitlist.com', '_blank')}
        >
          Get Early Access
        </button>
      </div>

      <div className="p-10 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
        <p className="text-slate-400 font-medium max-w-xs">
          Select a destination above to activate your offline support system.
        </p>
      </div>
    </div>
  );
}