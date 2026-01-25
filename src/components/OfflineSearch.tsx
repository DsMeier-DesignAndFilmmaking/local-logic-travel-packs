'use client';

import { useState, useEffect, useRef } from 'react';
import { getPack } from '../../scripts/offlineDB';
import VoiceInputButton from './VoiceInputButton';
import { NO_SIGNAL_MESSAGE } from '@/lib/travelSignalGuard';
import { extractSearchIntent, hasMeaningfulContent, extractQueryTokens } from '@/lib/transcriptNormalizer';
import { EMERGENCY_TERMS } from '@/lib/offlineSearch';

export interface MicroSituationMatch {
  cardHeadline: string;
  microTitle: string;
  actions: string[];
}

interface OfflineSearchProps {
  cityName: string;
  onResultClick?: (result: MicroSituationMatch) => void;
}

// ---- Top-level async search function (must be outside component) ----
export async function searchOffline(cityName: string, query: string) {
  if (!query) return [];

  try {
    const pack = await getPack(cityName);
    if (!pack) {
      return { type: 'no_signal', message: 'No offline pack downloaded for this city.', results: [] };
    }

    const lowerQuery = query.toLowerCase();
    const matches: any[] = [];
  
    Object.values(pack.tiers || {}).forEach((tier: any) => {
      tier.cards.forEach((card: any) => {
        (card.microSituations || []).forEach((ms: any) => {
          if (
            ms.title.toLowerCase().includes(lowerQuery) ||
            ms.actions.some((a: string) => a.toLowerCase().includes(lowerQuery))
          ) {
            matches.push({ card: card.headline, micro: ms.title, actions: ms.actions });
          }
        });
      });
    });

    if (matches.length === 0) {
      const fallbackResults: any[] = [];
      Object.values(pack.tiers || {}).forEach((tier: any) => {
        tier.cards.forEach((card: any) => {
          (card.microSituations || []).forEach((ms: any) => {
            fallbackResults.push({ card: card.headline, micro: ms.title, actions: ms.actions });
          });
        });
      });
      return { type: 'fallback', message: 'No strong matches, showing all offline content', results: fallbackResults };
    }
  
    return matches;

  } catch (err) {
    console.error('Offline search failed:', err);
    return { type: 'no_signal', message: 'Offline search error', results: [] };
  }
}

// ---- Component ----
export default function OfflineSearch({ cityName, onResultClick }: OfflineSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MicroSituationMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ---- Instant offline search ----
  useEffect(() => {
    const tokens = extractQueryTokens(query);
    if (tokens.length === 0) {
      setResults([]);
      setFallbackMessage(null);
      setShowVoiceHint(query.length > 0); // show voice hint only if user typed something
      return;
    }
    setShowVoiceHint(false);

    let cancelled = false;

    async function runSearch() {
      console.log('🔍 Offline search for:', cityName, query);

      const out = await searchOffline(cityName, query);
      if (cancelled) return;

      if (Array.isArray(out)) {
        setResults(out);
        setFallbackMessage(out.length === 0 ? NO_SIGNAL_MESSAGE : null);
      } else {
        setResults(out.results);
        setFallbackMessage(out.message);
      }
    }

    runSearch();
    return () => { cancelled = true; };
  }, [query, cityName]);

  // ---- Close search on outside click ----
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleResultClick = (result: MicroSituationMatch) => {
    if (onResultClick) onResultClick(result);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
  {/* Label and Subtext Area - Matched to Card Gutters */}
  <div className="mb-6 px-6 sm:px-10"> 
    <p className="text-sm opacity-90" style={{ color: 'var(--text-on-dark)' }}>
      Instant results from your local travel pack
    </p>
  </div>

  {/* Input Field Area - Matched to Card Gutters */}
  <div className="relative px-6 sm:px-10">
    <div className="relative group">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="What do you need at the moment..."
        className="w-full px-5 py-4 pr-14 text-base border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/40 transition-all placeholder:text-slate-400"
        style={{
          backgroundColor: '#FFFFFF',
          color: 'var(--text-primary)',
          minHeight: '60px',
        }}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <VoiceInputButton
          onTranscript={(transcript) => {
            const normalizedQuery = extractSearchIntent(transcript);
            if (hasMeaningfulContent(transcript)) setQuery(normalizedQuery);
            else setQuery(transcript);
            setIsOpen(true);
          }}
          disabled={false}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        />
      </div>
    </div>

    {/* Quick suggestions - Aligned with Input edge 
    {!query && (
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider mb-3 opacity-70" style={{ color: 'var(--text-on-dark-muted)' }}>
          Quick search:
        </p>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY_TERMS.slice(0, 8).map((term) => (
            <button
              key={term}
              onClick={() => { setQuery(term); setIsOpen(true); }}
              className="px-4 py-2 text-xs font-semibold rounded-full border transition-all hover:bg-white hover:text-blue-700 active:scale-95 touch-manipulation"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                borderColor: 'rgba(255,255,255,0.2)', 
                color: 'var(--text-on-light)' 
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    )}  */}

    {/* Results Dropdown - Width matched to Input field width */}
    {isOpen && query && (
      <div className="absolute left-6 right-6 sm:left-10 sm:right-10 z-50 mt-2 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn bg-white">
        <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100 flex justify-between items-center bg-slate-50 text-slate-500">
          <span>{fallbackMessage ? fallbackMessage : 'Offline Results'}</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{results.length} found</span>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleResultClick(result)}
              className="w-full text-left p-5 hover:bg-blue-50/50 transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {result.cardHeadline}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 italic">
                  {result.actions[0]}
                </div>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
  );
}
