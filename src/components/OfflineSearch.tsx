'use client';

import { useState, useEffect, useRef } from 'react';
import { searchOffline, EMERGENCY_TERMS } from '@/lib/offlineSearch';
import { getTier1Pack } from '@/lib/offlineStorage';

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
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          🔍 Offline Search
        </label>
        <p className="text-xs text-gray-600 mb-3">
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
          className="w-full px-4 py-3 pr-10 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            borderColor: query ? '#10B981' : '#D1D5DB',
            minHeight: '48px',
          }}
        />
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: query ? '#10B981' : '#9CA3AF' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Quick suggestions */}
      {!query && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2">Quick search:</p>
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
                  backgroundColor: '#F9FAFB',
                  borderColor: '#E5E7EB',
                  color: '#1A1A1A',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0FDF4';
                  e.currentTarget.style.borderColor = '#10B981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#E5E7EB';
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
            borderColor: '#10B981',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="sticky top-0 p-3 text-xs font-semibold border-b bg-green-50" style={{ borderColor: '#10B981', color: '#059669' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found (offline)
          </div>
          <div className="divide-y" style={{ borderColor: '#E5E7EB' }}>
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-4 transition-colors touch-manipulation"
                style={{
                  color: '#1A1A1A',
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
                    <div className="text-sm font-bold mb-1" style={{ color: '#059669' }}>
                      {result.cardHeadline}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 font-medium">
                      {result.microSituationTitle}
                    </div>
                    <div className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                      {result.action}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#9CA3AF' }}
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
            borderColor: '#E5E7EB',
          }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: '#9CA3AF' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>
            No results found for "{query}"
          </p>
          <p className="text-xs text-gray-600">
            Try different keywords or check the quick search suggestions
          </p>
        </div>
      )}
    </div>
  );
}
