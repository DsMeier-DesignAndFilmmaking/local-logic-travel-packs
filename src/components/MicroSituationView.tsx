'use client';

import { MicroSituation } from '@/lib/travelPacks';

interface MicroSituationViewProps {
  cardHeadline: string;
  microSituation: MicroSituation;
  onBack: () => void;
  onHome: () => void;
}

export default function MicroSituationView({
  cardHeadline,
  microSituation,
  onBack,
  onHome,
}: MicroSituationViewProps) {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Navigation - Aligned to grid */}
      <div className="pt-4 px-6 sm:px-10 flex items-center gap-4">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
      </svg>
      <button
          onClick={onHome}
          className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-on-light)' }}
        >
          All Categories
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold group transition-all"
          style={{ color: 'var(--text-on-light)' }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>Back to Situations</span>
        </button>
        <span className="opacity-30" style={{ color: 'var(--text-on-light)' }}>•</span>
        
      </div>

      {/* 2. Header Section - Aligned to grid */}
      <div className="px-6 sm:px-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60" style={{ color: 'var(--text-on-light)' }}>
          {cardHeadline}
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-on-light)' }}>
          {microSituation.title}
        </h2>
      </div>

      {/* 3. Actions List - Styled as standard rows */}
      <div className="px-6 sm:px-10 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-4" style={{ color: 'var(--text-on-light)' }}>
          Step-by-Step Actions:
        </h3>
        <div className="space-y-3">
          {microSituation.actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-5 p-6 sm:p-8 rounded-3xl border border-slate-200/10 bg-white shadow-sm"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 text-sm font-black">
                {index + 1}
              </span>
              <span className="text-base sm:text-lg font-medium leading-relaxed text-slate-800">
                {action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. What to do instead - Amber Pro-Tip Style */}
      {microSituation.whatToDoInstead && (
        <div className="px-6 sm:px-10">
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200/50 shadow-sm">
            <h4 className="font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#B45309' }}>
              <span>💡</span>
              <span>Pro-Tip / Alternative:</span>
            </h4>
            <p className="text-base sm:text-lg font-medium leading-relaxed text-amber-900/80">
              {microSituation.whatToDoInstead}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}