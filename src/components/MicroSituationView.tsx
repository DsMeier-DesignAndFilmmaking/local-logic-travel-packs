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
    <div className="space-y-6">
      {/* Navigation - on dark blue card */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--text-on-dark)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span style={{ color: 'var(--text-on-dark-muted)' }}>•</span>
        <button
          onClick={onHome}
          className="text-sm font-medium"
          style={{ color: 'var(--text-on-dark)' }}
        >
          All Problems
        </button>
      </div>

      {/* Header - on dark blue card */}
      <div>
        <p className="text-sm mb-2" style={{ color: 'var(--text-on-dark-muted)' }}>{cardHeadline}</p>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-on-dark)' }}>
          {microSituation.title}
        </h2>
      </div>

      {/* Actions - light gray bg */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-on-dark)' }}>
          What to do:
        </h3>
        <ul className="space-y-3">
          {microSituation.actions.map((action, index) => (
            <li
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{
                backgroundColor: '#F9FAFB',
                borderLeft: '4px solid var(--accent-green)',
              }}
            >
              <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-green)' }}>
                {index + 1}.
              </span>
              <span className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {action}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* What to do instead - amber bg */}
      {microSituation.whatToDoInstead && (
        <div
          className="p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: '#FFFBEB',
            borderLeftColor: '#B45309',
          }}
        >
          <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>💡</span>
            <span>What to do instead:</span>
          </h4>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {microSituation.whatToDoInstead}
          </p>
        </div>
      )}
    </div>
  );
}
