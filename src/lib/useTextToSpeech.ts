/**
 * Text-to-Speech Hook
 * 
 * Works offline using Web Speech API
 * - Can be toggled by user
 * - Reads summaries, not full articles
 * - Interruptible by user
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type TTSState = 
  | 'idle'        // Not speaking
  | 'speaking'    // Currently speaking
  | 'paused'      // Paused (can resume)
  | 'stopped';    // Stopped (must restart)

export interface UseTTSOptions {
  rate?: number;        // Speech rate (0.1 - 10, default: 1)
  pitch?: number;       // Speech pitch (0 - 2, default: 1)
  volume?: number;      // Speech volume (0 - 1, default: 1)
  lang?: string;        // Language code (default: 'en-US')
  voice?: SpeechSynthesisVoice; // Specific voice
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseTTSReturn {
  state: TTSState;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  cancel: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
}

/**
 * Check if TTS is supported
 */
function isTTSSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

/**
 * Get available voices
 */
function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !isTTSSupported()) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Hook for text-to-speech
 */
export function useTextToSpeech(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    lang = 'en-US',
    voice,
    onStart,
    onEnd,
    onError,
  } = options;

  const [state, setState] = useState<TTSState>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize
  useEffect(() => {
    const supported = isTTSSupported();
    setIsSupported(supported);

    if (supported) {
      synthesisRef.current = window.speechSynthesis;

      // Load voices
      const loadVoices = () => {
        const voices = getAvailableVoices();
        setAvailableVoices(voices);
      };

      // Voices may not be loaded immediately
      loadVoices();
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = loadVoices;
      }

      // Cleanup on unmount
      return () => {
        if (synthesisRef.current) {
          synthesisRef.current.cancel();
        }
      };
    }
  }, []);

  // Speak function
  const speak = useCallback((text: string) => {
    if (!isSupported || !synthesisRef.current) {
      if (onError) {
        onError('Text-to-speech not supported');
      }
      return;
    }

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = lang;

    // Set voice if provided
    if (voice) {
      utterance.voice = voice;
    } else {
      // Try to find a good default voice
      const voices = getAvailableVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && v.localService
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setState('speaking');
      if (onStart) {
        onStart();
      }
    };

    utterance.onend = () => {
      setState('idle');
      utteranceRef.current = null;
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      setState('idle');
      utteranceRef.current = null;
      if (onError) {
        onError(event.error || 'Speech synthesis error');
      }
    };

    utterance.onpause = () => {
      setState('paused');
    };

    utterance.onresume = () => {
      setState('speaking');
    };

    // Store reference
    utteranceRef.current = utterance;

    // Speak
    synthesisRef.current.speak(utterance);
  }, [isSupported, rate, pitch, volume, lang, voice, onStart, onEnd, onError]);

  // Pause function
  const pause = useCallback(() => {
    if (synthesisRef.current && state === 'speaking') {
      synthesisRef.current.pause();
      setState('paused');
    }
  }, [state]);

  // Resume function
  const resume = useCallback(() => {
    if (synthesisRef.current && state === 'paused') {
      synthesisRef.current.resume();
      setState('speaking');
    }
  }, [state]);

  // Stop function (can resume)
  const stop = useCallback(() => {
    if (synthesisRef.current) {
      if (state === 'speaking' || state === 'paused') {
        synthesisRef.current.pause();
      }
      setState('stopped');
    }
  }, [state]);

  // Cancel function (must restart)
  const cancel = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      utteranceRef.current = null;
      setState('idle');
    }
  }, []);

  return {
    state,
    isSupported,
    availableVoices,
    speak,
    pause,
    resume,
    stop,
    cancel,
    isSpeaking: state === 'speaking',
    isPaused: state === 'paused',
  };
}
