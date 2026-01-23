'use client';

import { useState, useEffect, useRef } from 'react';
import { searchOffline, EMERGENCY_TERMS } from '@/lib/offlineSearch';
import { getTier1Pack } from '@/lib/offlineStorage';
import VoiceInputButton from './VoiceInputButton';

interface OfflineSearchProps {
  cityName: string;
  onResultClick?: (result: { cardHeadline: string; microSituationTitle: string; action: string }) => void;
}

export default function OfflineSearch({ cityName, onResultClick }: OfflineSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof searchOffline>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Instant search - no network calls, filters preloaded JSON data
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Instant offline search through preloaded Tier 1 data
    const searchResults = searchOffline(cityName, query);
    setResults(searchResults);
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

  const handleResultClick = (result: ReturnType<typeof searchOffline>[0]) => {
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
              setQuery(transcript);
              setIsOpen(true);
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
            {results.length} result{results.length !== 1 ? 's' : ''} found (offline)
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {results.map((result, index) => (
              <button
                key={index}
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
                      {result.microSituationTitle}
                    </div>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {result.action}
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
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query && results.length === 0 && (
        <div
          className="absolute z-50 mt-2 w-full border-2 rounded-lg shadow-lg p-6 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'var(--border-light)',
          }}
        >
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
            No results found for "{query}"
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Try different keywords or check the quick search suggestions
          </p>
        </div>
      )}
    </div>
  );
}
