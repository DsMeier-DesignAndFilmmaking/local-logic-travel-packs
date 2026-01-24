/**
 * Offline Voice Input Hook
 * 
 * Uses Web Speech API for on-device speech recognition
 * - Works entirely offline (no cloud calls)
 * - Requests microphone permissions
 * - Falls back to manual text input if permission denied
 * - Never blocks on connectivity checks
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceInputState = 
  | 'idle'              // Not listening
  | 'checking'          // Checking browser support
  | 'requesting'        // Requesting microphone permission
  | 'listening'         // Actively listening
  | 'processing'       // Processing speech result
  | 'success'           // Successfully transcribed
  | 'error'             // Error occurred
  | 'not_supported'     // Browser doesn't support speech recognition
  | 'permission_denied'  // Microphone permission denied
  | 'no_speech'         // No speech detected
  | 'aborted';          // Recognition aborted

export interface VoiceInputResult {
  transcript: string;
  confidence: number;
}

export interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;        // Keep listening after result
  interimResults?: boolean;     // Show interim results
  lang?: string;               // Language code (default: 'en-US')
  autoStart?: boolean;          // Start listening automatically
}

export interface UseVoiceInputReturn {
  state: VoiceInputState;
  transcript: string;
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  error: string | null;
}

// Browser Speech Recognition API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

/**
 * Check if browser supports speech recognition
 */
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const win = window as WindowWithSpeechRecognition;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Get Speech Recognition constructor
 */
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  
  const win = window as WindowWithSpeechRecognition;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Check microphone permission status
 */
async function checkMicrophonePermission(): Promise<PermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    // Fallback: assume we need to request
    return 'prompt';
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch (err) {
    // Some browsers don't support microphone permission query
    // Fallback: assume we need to request
    return 'prompt';
  }
}

/**
 * Request microphone access
 */
async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop the stream - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Hook for offline voice input
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    onTranscript,
    onError,
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    autoStart = false,
  } = options;

  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check browser support on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    
    if (supported) {
      setState('idle');
    } else {
      setState('not_supported');
    }
  }, []);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        setTranscript(finalTranscriptRef.current.trim());
        
        if (onTranscript) {
          onTranscript(finalTranscriptRef.current.trim());
        }
        
        setState('success');
        
        // Reset to idle after brief success state
        setTimeout(() => {
          setState((currentState) => {
            if (currentState === 'success') {
              return 'idle';
            }
            return currentState;
          });
        }, 1000);
      } else if (interimTranscript) {
        setTranscript(finalTranscriptRef.current + interimTranscript);
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = event.error;
      let newState: VoiceInputState = 'error';
      
      // Suppress async listener errors (from Chrome extensions/Speech API internals)
      // These are not critical and don't affect functionality
      if (typeof errorMessage === 'string' && 
          (errorMessage.includes('listener') || errorMessage.includes('message channel'))) {
        console.warn('Speech API internal error (non-critical, likely from browser extension):', errorMessage);
        // Don't change state or show error to user - this is a browser/extension issue
        return;
      }
      
      if (errorMessage === 'no-speech') {
        newState = 'no_speech';
        setError('No speech detected. Please try again.');
      } else if (errorMessage === 'audio-capture') {
        newState = 'permission_denied';
        setError('Microphone not accessible. Please check your permissions.');
      } else if (errorMessage === 'not-allowed') {
        newState = 'permission_denied';
        setError('Microphone permission denied. Please enable it in your browser settings.');
      } else if (errorMessage === 'aborted') {
        newState = 'aborted';
        setError('Speech recognition was aborted.');
      } else {
        // Log but don't show generic errors to user (might be extension-related)
        console.warn('Speech recognition error:', errorMessage);
        setState('idle'); // Reset to idle instead of showing error
        return;
      }
      
      setState(newState);
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Handle end
    recognition.onend = () => {
      setState((currentState) => {
        if (currentState === 'requesting' || currentState === 'processing') {
          return 'idle';
        }
        return currentState;
      });
    };
    
    // Handle abort (suppress async listener errors)
    try {
      // Wrap recognition methods to catch async listener errors
      const originalStart = recognition.start.bind(recognition);
      recognition.start = function() {
        try {
          originalStart();
        } catch (error: any) {
          // Suppress async listener errors
          if (error?.message?.includes('listener') || error?.message?.includes('message channel')) {
            console.warn('Speech API async listener error (non-critical):', error.message);
            return;
          }
          throw error;
        }
      };
    } catch (error) {
      // Ignore - recognition might not support this
    }

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [isSupported, continuous, interimResults, lang, onTranscript, onError]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isSupported && state === 'idle') {
      startListening();
    }
  }, [autoStart, isSupported, state]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setState('not_supported');
      return;
    }

    if (!recognitionRef.current) {
      setState('error');
      setError('Speech recognition not initialized');
      return;
    }

    setState('checking');
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';

    // Check microphone permission
    const permissionState = await checkMicrophonePermission();
    
    if (permissionState === 'denied') {
      setState('permission_denied');
      setError('Microphone permission denied. Please enable it in your browser settings.');
      if (onError) {
        onError('permission_denied');
      }
      return;
    }

    // Request permission if needed
    if (permissionState === 'prompt') {
      setState('requesting');
      const granted = await requestMicrophoneAccess();
      
      if (!granted) {
        setState('permission_denied');
        setError('Microphone permission denied. Please enable it in your browser settings.');
        if (onError) {
          onError('permission_denied');
        }
        return;
      }
    }

    // Start recognition
    try {
      setState('listening');
      recognitionRef.current.start();
    } catch (err: any) {
      // Suppress async listener errors (from Chrome extensions)
      if (err?.message?.includes('listener') || err?.message?.includes('message channel')) {
        console.warn('Speech API async listener error (non-critical):', err.message);
        // Still try to start - the error might be from an extension
        try {
          recognitionRef.current.start();
        } catch (retryErr) {
          // If it still fails, handle normally
          setState('error');
          setError('Failed to start speech recognition. Please try again.');
          if (onError) {
            onError('start_failed');
          }
        }
        return;
      }
      
      setState('error');
      setError('Failed to start speech recognition. Please try again.');
      if (onError) {
        onError('start_failed');
      }
    }
  }, [isSupported, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setState('idle');
      } catch (err) {
        // Ignore errors on stop
      }
    }
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
    setState('idle');
  }, [stopListening]);

  return {
    state,
    transcript,
    isSupported,
    isListening: state === 'listening',
    startListening,
    stopListening,
    reset,
    error,
  };
}
