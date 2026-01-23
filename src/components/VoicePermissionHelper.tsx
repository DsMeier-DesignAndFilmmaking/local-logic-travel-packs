/**
 * Voice Permission Helper Component
 * 
 * Shows helpful instructions when microphone permission is needed
 */

'use client';

import React from 'react';

interface VoicePermissionHelperProps {
  state: 'permission_denied' | 'not_supported' | 'error';
  onDismiss?: () => void;
}

export default function VoicePermissionHelper({ state, onDismiss }: VoicePermissionHelperProps) {
  if (state === 'not_supported') {
    return (
      <div
        className="mt-3 p-4 rounded-lg border-2"
        style={{
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">ℹ️</div>
          <div className="flex-1">
            <div className="font-semibold mb-1" style={{ color: '#92400E' }}>
              Voice input not supported
            </div>
            <div className="text-sm" style={{ color: '#78350F' }}>
              Your browser doesn't support speech recognition. Please use the text input instead.
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-lg font-bold"
              style={{ color: '#92400E' }}
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state === 'permission_denied') {
    return (
      <div
        className="mt-3 p-4 rounded-lg border-2"
        style={{
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">🎤</div>
          <div className="flex-1">
            <div className="font-semibold mb-2" style={{ color: '#991B1B' }}>
              Microphone permission needed
            </div>
            <div className="text-sm mb-3" style={{ color: '#7F1D1D' }}>
              To use voice input, please enable microphone access in your browser settings.
            </div>
            <div className="text-xs space-y-1" style={{ color: '#7F1D1D' }}>
              <div className="font-semibold">How to enable:</div>
              <div>
                <strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Microphone → Allow
              </div>
              <div>
                <strong>Firefox:</strong> Click the lock icon → Permissions → Microphone → Allow
              </div>
              <div>
                <strong>Safari:</strong> Safari → Settings → Websites → Microphone → Allow for this site
              </div>
            </div>
            <div className="mt-3 text-xs italic" style={{ color: '#7F1D1D' }}>
              💡 You can still use text input - voice is optional!
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-lg font-bold"
              style={{ color: '#991B1B' }}
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        className="mt-3 p-4 rounded-lg border-2"
        style={{
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div className="flex-1">
            <div className="font-semibold mb-1" style={{ color: '#92400E' }}>
              Voice input error
            </div>
            <div className="text-sm" style={{ color: '#78350F' }}>
              Something went wrong with voice recognition. Please try again or use text input instead.
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-lg font-bold"
              style={{ color: '#92400E' }}
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
