'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { normalizeCityName } from '@/lib/cities';

interface InstallAppProps {
  city: string;
}

/**
 * Install App Component (A2HS)
 * 
 * Handles "Add to Home Screen" installation:
 * - Shows install prompt/instructions
 * - Installs PWA shell only
 * - Shows only current city
 * - No navigation to other cities unless online
 * 
 * Separate from Download Pack - this is for PWA installation
 */
export default function InstallApp({ city }: InstallAppProps) {
  const { triggerInstall, canInstall, isStandalone, platform } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Show iOS instructions if iOS and not standalone
  useEffect(() => {
    if (platform === 'ios' && !isStandalone && canInstall) {
      setShowIOSInstructions(true);
    }
  }, [platform, isStandalone, canInstall]);

  const handleInstall = async () => {
    if (isInstalling || isStandalone) return;
    
    setIsInstalling(true);
    
    try {
      if (platform === 'ios') {
        // iOS requires manual installation
        setShowIOSInstructions(true);
      } else {
        // Android/Chrome - programmatic install
        const result = await triggerInstall();
        if (result === true) {
          console.log('✅ App installed successfully');
        } else if (result === 'ios_manual') {
          setShowIOSInstructions(true);
        }
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // If already installed, show installed state
  if (isStandalone) {
    return (
      <div className="p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-3xl border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <div>
            <h4 className="text-blue-900 text-xs sm:text-sm font-black uppercase tracking-widest">
              App Installed
            </h4>
            <p className="text-blue-700 text-[10px] sm:text-xs font-medium leading-relaxed mt-1">
              This {city} pack is installed as a standalone app
            </p>
          </div>
        </div>
      </div>
    );
  }

  // iOS manual installation instructions
  if (showIOSInstructions) {
    return (
      <div className="p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-3xl border border-blue-200">
        <div className="mb-4">
          <h4 className="text-blue-900 text-xs sm:text-sm font-black uppercase tracking-widest mb-2">
            Install {city} Pack
          </h4>
          <p className="text-blue-800 text-[10px] sm:text-xs font-medium leading-relaxed mb-4">
            Add this pack to your home screen for quick access
          </p>
          <ol className="text-blue-700 text-[10px] sm:text-xs space-y-2 list-decimal list-inside">
            <li>Tap the <strong>Share</strong> button <span className="text-lg">⎋</span></li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>
        <button
          onClick={() => setShowIOSInstructions(false)}
          className="w-full py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs uppercase tracking-widest transition-colors"
        >
          Got It
        </button>
      </div>
    );
  }

  // Install button (Android/Chrome or iOS before showing instructions)
  return (
    <div className="p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-3xl border border-blue-200">
      <div className="mb-4">
        <h4 className="text-blue-900 text-xs sm:text-sm font-black uppercase tracking-widest">
          Install App
        </h4>
        <p className="text-blue-700 text-[10px] sm:text-xs font-medium leading-relaxed mt-1">
          Install this {city} pack as a standalone app. Shows only this city.
        </p>
      </div>
      <button
        onClick={handleInstall}
        disabled={!canInstall || isInstalling}
        className="w-full py-3 sm:py-4 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:text-blue-100 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {isInstalling ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            INSTALLING...
          </>
        ) : (
          'INSTALL TO HOME SCREEN'
        )}
      </button>
    </div>
  );
}
