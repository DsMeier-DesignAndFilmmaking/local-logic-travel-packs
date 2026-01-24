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
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-on-dark)' }}>
          🔍 Offline Search
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-on-dark-muted)' }}>
          Search all offline content instantly
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search: toilet, ATM, pharmacy, metro, food..."
          className="w-full px-4 py-3 pr-20 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          style={{
            backgroundColor: '#FFFFFF',
            color: 'var(--text-primary)',
            borderColor: query ? 'var(--accent-green)' : 'var(--border-light)',
            minHeight: '48px',
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <VoiceInputButton
            onTranscript={(transcript) => {
              const normalizedQuery = extractSearchIntent(transcript);
              if (hasMeaningfulContent(transcript)) setQuery(normalizedQuery);
              else setQuery(transcript);
              setIsOpen(true);
            }}
            disabled={false}
            showHelper
          />
        </div>
      </div>

      {/* Quick suggestions */}
      {!query && (
        <div className="mt-3">
          <p className="text-xs mb-2" style={{ color: 'var(--text-on-dark-muted)' }}>Quick search:</p>
          <div className="flex flex-wrap gap-2">
            {EMERGENCY_TERMS.slice(0, 8).map((term) => (
              <button
                key={term}
                onClick={() => { setQuery(term); setIsOpen(true); }}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors touch-manipulation"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isOpen && query && (
        <div className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-xl max-h-96 overflow-y-auto" style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--accent-green)' }}>
          <div className="sticky top-0 p-3 text-xs font-semibold border-b" style={{ borderColor: 'var(--accent-green)', backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
            {fallbackMessage ? `${fallbackMessage} (${results.length} items)` : `${results.length} result(s) found (offline)`}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {results.map((result, index) => {
              const preview = result.actions[0] || '';
              return (
                <button
                  key={`${result.cardHeadline}-${result.microTitle}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 transition-colors touch-manipulation"
                  style={{ color: 'var(--text-primary)', minHeight: '60px' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
                        {result.cardHeadline}
                      </div>
                      <div className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {result.microTitle}
                      </div>
                      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {preview}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice hint */}
      {isOpen && query && showVoiceHint && (
        <div className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-lg p-6 text-center" style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--accent-green)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Try asking about food, places, or things to do nearby.
          </p>
        </div>
      )}
    </div>
  );
}
