/**
 * Voice Input Button Component
 * 
 * Provides voice input functionality with proper error handling
 * and permission states
 */

'use client';

import React, { useState } from 'react';
import { useVoiceInput, VoiceInputState } from '@/lib/useVoiceInput';
import VoicePermissionHelper from './VoicePermissionHelper';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
  showHelper?: boolean; // Show permission helper below button
}

export default function VoiceInputButton({ 
  onTranscript, 
  disabled = false,
  className = '',
  showHelper = false,
}: VoiceInputButtonProps) {
  const [showPermissionHelper, setShowPermissionHelper] = useState(false);
  
  const {
    state,
    transcript,
    isSupported,
    isListening,
    startListening,
    stopListening,
    reset,
    error,
  } = useVoiceInput({
    onTranscript,
    continuous: false,
    interimResults: true,
  });

  // Show helper when permission is denied or error occurs
  React.useEffect(() => {
    if (showHelper && (state === 'permission_denied' || state === 'error' || state === 'not_supported')) {
      setShowPermissionHelper(true);
    } else {
      setShowPermissionHelper(false);
    }
  }, [state, showHelper]);

  // Auto-submit transcript when it's finalized
  React.useEffect(() => {
    if (transcript && state === 'success' && transcript.trim()) {
      onTranscript(transcript);
      // Reset after submitting
      setTimeout(() => {
        reset();
      }, 500);
    }
  }, [transcript, state, onTranscript, reset]);

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getButtonText = (): string => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'requesting':
        return 'Requesting access...';
      case 'checking':
        return 'Checking...';
      default:
        return 'Voice';
    }
  };

  const getButtonIcon = (): JSX.Element => {
    if (isListening) {
      // Pulsing microphone icon when listening
      return (
        <svg
          className="w-5 h-5 animate-pulse"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      );
    }
    
    // Default microphone icon
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    );
  };

  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      minWidth: '48px',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      border: '2px solid',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
    };

    if (isListening) {
      return {
        ...baseStyle,
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        color: '#DC2626',
      };
    }

    if (state === 'permission_denied' || state === 'error') {
      return {
        ...baseStyle,
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        color: '#D97706',
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
        onClick={handleClick}
        disabled={disabled || state === 'checking' || state === 'requesting'}
        className={`${className} touch-manipulation`}
        style={getButtonStyle()}
        title={
          state === 'permission_denied'
            ? 'Microphone permission denied. Click to try again.'
            : isListening
            ? 'Click to stop listening'
            : 'Click to start voice input'
        }
        onMouseEnter={(e) => {
          if (!disabled && !isListening) {
            e.currentTarget.style.backgroundColor = '#F0FDF4';
            e.currentTarget.style.borderColor = 'var(--accent-green)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isListening) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }
        }}
      >
        {getButtonIcon()}
      </button>

      {/* Error tooltip */}
      {error && (state === 'permission_denied' || state === 'error') && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-xs max-w-xs z-50"
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #F59E0B',
            color: '#92400E',
          }}
        >
          <div className="font-semibold mb-1">⚠️ {error}</div>
          {state === 'permission_denied' && (
            <div className="text-xs">
              Please enable microphone access in your browser settings and try again.
            </div>
          )}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{
            backgroundColor: '#EF4444',
            boxShadow: '0 0 0 2px #FFFFFF',
          }}
        />
      )}

      {/* Permission helper (shown below button if showHelper is true) */}
      {showHelper && showPermissionHelper && (
        <div className="absolute top-full left-0 mt-2 z-50" style={{ width: '300px' }}>
          <VoicePermissionHelper
            state={
              state === 'not_supported'
                ? 'not_supported'
                : state === 'permission_denied'
                ? 'permission_denied'
                : 'error'
            }
            onDismiss={() => setShowPermissionHelper(false)}
          />
        </div>
      )}
    </div>
  );
}
