/**
 * Text-to-Speech Button Component
 * 
 * Provides TTS functionality with user controls
 */

'use client';

import React, { useState } from 'react';
import { useTextToSpeech, TTSState } from '@/lib/useTextToSpeech';
import { SearchResult } from '@/lib/offlineSearchEngine';
import { generateTTSSummary, generateTTSResultsScript, cleanTextForTTS } from '@/lib/ttsScripts';

interface TTSButtonProps {
  results?: SearchResult[];
  singleResult?: SearchResult;
  query?: string;
  disabled?: boolean;
  className?: string;
  autoPlay?: boolean; // Auto-play when results change
}

export default function TTSButton({
  results,
  singleResult,
  query,
  disabled = false,
  className = '',
  autoPlay = false,
}: TTSButtonProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const {
    state,
    isSupported,
    speak,
    pause,
    resume,
    stop,
    cancel,
    isSpeaking,
    isPaused,
  } = useTextToSpeech({
    onEnd: () => {
      setIsEnabled(false);
    },
    onError: (error) => {
      console.warn('TTS error:', error);
      setIsEnabled(false);
    },
  });

  // Auto-play when results change (if enabled)
  React.useEffect(() => {
    if (autoPlay && isEnabled && (results || singleResult)) {
      handleSpeak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, singleResult, autoPlay, isEnabled]);

  const handleSpeak = () => {
    if (!isSupported || disabled) return;

    // Cancel any ongoing speech
    cancel();

    let text = '';

    if (singleResult) {
      text = generateTTSSummary(singleResult);
    } else if (results && results.length > 0) {
      text = generateTTSResultsScript(results, query);
    } else {
      return;
    }

    // Clean text for better TTS
    text = cleanTextForTTS(text);

    if (text) {
      setIsEnabled(true);
      speak(text);
    }
  };

  const handleToggle = () => {
    if (!isSupported || disabled) return;

    if (isSpeaking) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      handleSpeak();
    }
  };

  const handleStop = () => {
    stop();
    setIsEnabled(false);
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  const getButtonIcon = (): React.ReactElement => {
    if (isPaused) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    }

    if (isSpeaking) {
      return (
        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
    );
  };

  const getButtonText = (): string => {
    if (isPaused) return 'Resume';
    if (isSpeaking) return 'Pause';
    return 'Listen';
  };

  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      minWidth: '48px',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '8px',
      border: '2px solid',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: '8px 12px',
    };

    if (isSpeaking || isPaused) {
      return {
        ...baseStyle,
        backgroundColor: '#F0FDF4',
        borderColor: 'var(--accent-green)',
        color: 'var(--accent-green)',
      };
    }

    return {
      ...baseStyle,
      backgroundColor: '#FFFFFF',
      borderColor: 'var(--border-light)',
      color: 'var(--text-primary)',
    };
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        onDoubleClick={handleStop}
        disabled={disabled || (!results?.length && !singleResult)}
        className={`${className} touch-manipulation`}
        style={getButtonStyle()}
        title={
          isSpeaking
            ? 'Click to pause, double-click to stop'
            : isPaused
            ? 'Click to resume'
            : 'Click to listen to results'
        }
        onMouseEnter={(e) => {
          if (!disabled && !isSpeaking && !isPaused) {
            e.currentTarget.style.backgroundColor = '#F0FDF4';
            e.currentTarget.style.borderColor = 'var(--accent-green)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isSpeaking && !isPaused) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }
        }}
      >
        {getButtonIcon()}
        <span className="text-sm font-medium">{getButtonText()}</span>
      </button>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{
            backgroundColor: 'var(--accent-green)',
            boxShadow: '0 0 0 2px #FFFFFF',
          }}
        />
      )}
    </div>
  );
}
