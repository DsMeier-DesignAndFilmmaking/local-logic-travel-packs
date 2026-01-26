'use client';

import { useState, useEffect, useRef } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
// Fixed import path: Avoid importing from .next folder
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [isMobile, setIsMobile] = useState(false);
const [showInstructions, setShowInstructions] = useState(false);

// Consolidate iOS logic into one state
const [iosStep, setIosStep] = useState<1 | 2 | 3 | 4>(1);

// Standard PWA Hook
const { triggerInstall, canInstall } = usePWAInstall();
  // 1. Add this Ref at the top with your other states
  const lastJumpRef = useRef(0);

  // Detect device type for custom modal messaging
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    async function checkExisting() {
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) {
        console.error('Error checking IndexedDB:', err);
      }
    }
    checkExisting();
  }, [pack.city]);

  const handleSync = async () => {
    if (status !== 'idle') return;
    
    setStatus('syncing');

    const downloadData = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: pack.tiers,
    };

    try {
      // 1. Lock data into IndexedDB
      await savePack(downloadData);
      
      // 2. Tactical delay for UX weight
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 3. Trigger Native App Install (Address Bar behavior)
      if (canInstall) {
        await triggerInstall();
      }

      setStatus('saved');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to save offline pack:', err);
      setStatus('idle');
    }
  };

  const handleLaunchApp = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
  
    if (isStandalone) {
      setShowSuccessModal(false);
      window.location.reload();
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // 1. Close the success modal
      setShowSuccessModal(false);
      // 2. Open the persistent "Pointer" instructions
      setShowInstructions(true);
    } else {
      setShowSuccessModal(false);
      window.location.href = '/?mode=standalone';
    }
  };


  useEffect(() => {
    let lastHeight = window.innerHeight;
  
    const advance = () => {
      const now = Date.now();
      if (now - lastJumpRef.current < 1000) return;
  
      setIosStep((prev) => {
        // Logic for 3-step sequence
        if (prev < 3) {
          lastJumpRef.current = now;
          return (prev + 1) as 1 | 2 | 3;
        }
        return prev;
      });
    };
  
    const handleInteraction = () => {
      if (!showInstructions) return;
      
      // Step 1 -> 2: Triggered by address bar resize
      if (iosStep === 1 && window.innerHeight !== lastHeight) {
        advance();
        lastHeight = window.innerHeight;
      }
    };
  
    const handleVisibility = () => {
      // Step 2 -> 3: Triggered when the native Share Sheet covers the app
      if (document.hidden && showInstructions && iosStep === 2) {
        advance();
      }
    };
  
    window.addEventListener('resize', handleInteraction);
    window.addEventListener('blur', advance); // Backup for menu focus loss
    document.addEventListener('visibilitychange', handleVisibility);
  
    return () => {
      window.removeEventListener('resize', handleInteraction);
      window.removeEventListener('blur', advance);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showInstructions, iosStep]); // Added iosStep to dependencies for specific step-checks

  const config = {
    idle: {
      text: "Download for Offline Use",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      styles: "bg-transparent text-slate-900 border border-slate-200 hover:bg-slate-50"
    },
    syncing: {
      text: "Syncing Tactical Logic...",
      icon: (
        <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      styles: "bg-slate-50 text-blue-600 border border-blue-100 animate-pulse cursor-wait"
    },
    saved: {
      text: "Available Offline",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      styles: "bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default"
    }
  };

  const current = config[status];

  return (
    <div className="w-full space-y-3">
      <button
        onClick={handleSync}
        disabled={status !== 'idle'}
        className={`w-full px-6 py-4 rounded-2xl focus:outline-none transition-all font-bold flex items-center justify-center gap-3 active:scale-[0.98] touch-manipulation ${current.styles}`}
      >
        {current.icon}
        {current.text}
      </button>

      {status === 'saved' && (
        <p className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-widest animate-fadeIn">
          Saved to local vault • No signal required
        </p>
      )}

{/* SUCCESS MODAL */}
{showSuccessModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
      
      {showSuccessModal === true ? (
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Sync Complete</h2>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Tactical data is now locked in your local vault.
          </p>
          <button 
            onClick={handleLaunchApp}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-[0.98]"
          >
            Confirm & Save App to Home Screen
          </button>
        </div>
      ) : (
        <div className="text-left">
          <h2 className="text-xl font-black text-slate-900 mb-4">Install to Home Screen</h2>
          <p className="text-slate-600 mb-6 text-sm">
            To access this pack offline anytime, you must add it to your Home Screen:
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
              <span>Tap the <strong className="text-blue-600">Share</strong> icon (the square with an arrow)</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
              <span>Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong></span>
            </div>
          </div>

          <button 
            onClick={() => setShowSuccessModal(false)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-[0.98]"
          >
            Got it, I'll do that
          </button>
        </div>
      )}
    </div>
  </div>
      )}

{showInstructions && (
  <div className="fixed inset-x-0 top-0 z-[120] p-4 pt-12 pointer-events-none">
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md -z-10 animate-in fade-in duration-500" />

    <div className="bg-slate-900 border border-white/20 rounded-[32px] shadow-2xl overflow-hidden max-w-sm mx-auto pointer-events-auto">
      
      {/* 3-Step Tracker */}
      <div className="flex h-1.5 w-full bg-white/10 gap-1 p-1">
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            className={`h-full flex-1 rounded-full transition-all duration-500 ${
              s <= iosStep ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      <div className="p-5 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
          <span className="text-emerald-400 font-black text-xl">{iosStep}</span>
        </div>
        
        <div className="flex-grow">
          <p className="text-emerald-500/50 text-[10px] font-black uppercase tracking-widest mb-1">
            {iosStep === 3 ? "Final Destination" : "Tactical Guide"}
          </p>
          <h3 className="text-white font-bold text-[15px] leading-tight">
            {iosStep === 1 && "Tap the browser bar below"}
            {iosStep === 2 && (
              <span>
                Tap <span className="text-emerald-400">'AA'</span> or <span className="text-emerald-400">'...'</span> <br/>
                <span className="text-white/60 text-xs font-normal">then select the 'Share' icon</span>
              </span>
            )}
            {iosStep === 3 && (
              <span>
                Find <span className="text-emerald-400">'Add to Home Screen'</span> <br/>
                <span className="text-white/60 text-xs font-normal">You may need to tap '... More' first</span>
              </span>
            )}
          </h3>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}