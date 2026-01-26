'use client';

import { useState, useMemo } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface SpontaneityProps {
  pack: TravelPack | null;
}

export default function Spontaneity({ pack }: SpontaneityProps) {
  /**
   * FINAL SAFETY GATE:
   * If a pack object exists (even if it's currently loading), we self-destruct.
   * This prevents the "Double Container" bug where the Landing Page items 
   * appear inside the City Vault.
   */
  if (pack && pack.city) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-10 animate-in fade-in duration-700">
      {/* 1. Header Section */}
      <div className="mb-8">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Spontaneity & Moments
        </h3>
        <p className="text-sm sm:text-base font-medium text-slate-500 max-w-xl">
          Exploration ideas and AI-driven spontaneity for your travels.
        </p>
      </div>

      {/* 2. AI SPONTANEITY ENGINE PROMO */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
          {/* Decorative Background Elements */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                  System Development in Progress
                </span>
              </div>
              <h4 className="text-2xl font-bold mb-3 tracking-tight">The Spontaneity Engine™</h4>
              <p className="text-slate-400 text-base leading-relaxed">
                I am building an AI system that generates hyper-local, real-time exploration based on your specific location and vibe. Verified offline assets are currently available for selected cities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <button 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all active:scale-95 whitespace-nowrap shadow-sm"
                style={{ backgroundColor: '#E8FBF8', borderColor: '#B2E5DE', color: '#0D2D29' }}
                onClick={() => window.open('https://dan-meier-portfolio.vercel.app/projects/travel-and-ai/', '_blank')}
              >
                <span className="text-sm font-bold">View System Architecture</span>
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

      {/* 3. Placeholder / Action Required */}
      <div className="sm:px-0">
        <div className="p-10 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
          <p className="text-slate-400 font-medium max-w-xs">
            Select a destination above to activate your offline tactical support system.
            <br/><br/>
            Once synced, this area will be replaced by your verified city vault assets.
          </p>
        </div>
      </div>
    </div>
  );
}