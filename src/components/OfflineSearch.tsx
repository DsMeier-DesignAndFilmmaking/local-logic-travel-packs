'use client';

import { useState, useEffect, useRef } from 'react';
import { searchOffline, EMERGENCY_TERMS, type MicroSituationMatch } from '@/lib/offlineSearch';
import { getTier1Pack } from '@/lib/offlineStorage';
import VoiceInputButton from './VoiceInputButton';
import { NO_SIGNAL_MESSAGE } from '@/lib/travelSignalGuard';
import { extractSearchIntent, hasMeaningfulContent, extractQueryTokens } from '@/lib/transcriptNormalizer';

interface OfflineSearchProps {
  cityName: string;
  onResultClick?: (result: MicroSituationMatch) => void;
}

export default function OfflineSearch({ cityName, onResultClick }: OfflineSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MicroSituationMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Instant search - no network calls, filters preloaded JSON data
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setFallbackMessage(null);
      setShowVoiceHint(false);
      return;
    }

    // If no tokens remain after stop-word removal, show voice hint and skip search.
    const tokens = extractQueryTokens(query);
    if (tokens.length === 0) {
      setResults([]);
      setFallbackMessage(null);
      setShowVoiceHint(true);
      return;
    }
    setShowVoiceHint(false);

    // Offline search: guard, then search. May return results, no_signal, or fallback (0 matches).
    const out = searchOffline(cityName, query);

    if (!Array.isArray(out)) {
      // no_signal: results []; fallback: results from pack when no strong match
      setResults(out.type === 'fallback' ? out.results : []);
      setFallbackMessage(out.message);
      return;
    }

    setResults(out);
    setFallbackMessage(out.length === 0 ? NO_SIGNAL_MESSAGE : null);
  }, [query, cityName]);

  // Close search when clicking outside
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
    if (onResultClick) {
      onResultClick(result);
    }
    setIsOpen(false);
    setQuery('');
  };

  // Check if Tier 1 pack is available offline
  const tier1Pack = getTier1Pack(cityName);
  const isOfflineAvailable = !!tier1Pack;

  if (!isOfflineAvailable) {
    return null; // Don't show search if no offline content
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-on-dark)' }}>
          🔍 Offline Search
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-on-dark-muted)' }}>
          Search through all Tier 1 content instantly - no network required
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
          {/* Voice input button */}
          <VoiceInputButton
            onTranscript={(transcript) => {
              // SANITY CHECK: Verify transcript is a real string
              console.log("Voice transcript:", transcript);
              console.log("Transcript type:", typeof transcript);
              console.log("Transcript length:", transcript?.length);
              
              // Normalize transcript: remove filler words and clean
              const normalizedQuery = extractSearchIntent(transcript);
              console.log("Normalized query:", normalizedQuery);
              
              // Only set query if it has meaningful content
              if (hasMeaningfulContent(transcript)) {
                setQuery(normalizedQuery);
                setIsOpen(true);
              } else {
                console.log("Transcript has no meaningful content after normalization");
                // Still show the original transcript so user can see what was heard
                setQuery(transcript);
                setIsOpen(true);
              }
            }}
            disabled={!isOfflineAvailable}
            className="flex-shrink-0"
            showHelper={true}
          />
          
          {/* Search icon */}
          <svg
            className="w-5 h-5 pointer-events-none flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: query ? 'var(--accent-green)' : '#6b7280' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
                onClick={() => {
                  setQuery(term);
                  setIsOpen(true);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors touch-manipulation"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-green-bg)';
                  e.currentTarget.style.borderColor = 'var(--accent-green)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results - Instant display, no network calls */}
      {isOpen && query && results.length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-xl max-h-96 overflow-y-auto"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'var(--accent-green)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="sticky top-0 p-3 text-xs font-semibold border-b" style={{ borderColor: 'var(--accent-green)', backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
            {fallbackMessage ? (
              <div>
                <div className="mb-1">{fallbackMessage}</div>
                <div className="text-xs opacity-75">{results.length} suggestion{results.length !== 1 ? 's' : ''}</div>
              </div>
            ) : (
              `${results.length} result${results.length !== 1 ? 's' : ''} found (offline)`
            )}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {results.map((result, index) => {
              const preview = result.matchedActions[0] || result.microSituation.actions[0] || '';
              return (
              <button
                key={`${result.cardHeadline}-${result.microSituation.title}-${index}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-4 transition-colors touch-manipulation"
                style={{
                  color: 'var(--text-primary)',
                  minHeight: '60px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0FDF4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0FDF4';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
                      {result.cardHeadline}
                    </div>
                    <div className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {result.microSituation.title}
                    </div>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {preview}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#6b7280' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
            })}
          </div>
        </div>
      )}

      {/* Voice hint UI - when no tokens remain after normalization */}
      {isOpen && query && showVoiceHint && (
        <div
          className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-lg p-6 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'var(--accent-green)',
          }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--accent-green)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Try asking about food, places, or things to do nearby.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            Examples: "late night food", "I'm lost", "toilet nearby", "quiet coffee"
          </p>
        </div>
      )}

      {/* No results or fallback message */}
      {isOpen && query && results.length === 0 && !showVoiceHint && (
        <div
          className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-lg p-6 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: fallbackMessage ? 'var(--accent-green)' : 'var(--border-light)',
          }}
        >
          {fallbackMessage ? (
            <>
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--accent-green)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {fallbackMessage}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Examples: "late night food", "I'm lost", "toilet nearby"
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#6b7280' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Try asking about food, places, or things to do nearby.
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Examples: "late night food", "quiet coffee", "is this area safe at night"
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
