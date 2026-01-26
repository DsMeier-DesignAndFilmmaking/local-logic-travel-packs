'use client';

import { useState, useEffect } from 'react';
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
  // Add this state to track which step of the iOS menu they are in
  const [iosStep, setIosStep] = useState(1);
  
  const { triggerInstall, canInstall } = usePWAInstall();

  // Add 'instructions' to the possible steps
  const [step, setStep] = useState<'success' | 'instructions'>('success');
  const [showInstructions, setShowInstructions] = useState(false);

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
      
      {step === 'success' ? (
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
  <div className="fixed inset-0 z-[120] pointer-events-none">
    {/* 1. The Ghost Overlay: Dims the page content but lets the user see the browser bars */}
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-none" />

    {/* 2. The Dynamic Guide Box */}
    <div className="absolute bottom-20 left-4 right-4 pointer-events-auto">
      <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div className={`h-full bg-blue-600 transition-all duration-500 ${iosStep === 1 ? 'w-1/3' : iosStep === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        <div className="p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
            {iosStep}
          </div>
          
          <div className="flex-grow">
            <h3 className="text-slate-900 font-bold text-base leading-tight">
              {iosStep === 1 && "Tap the Menu icon"}
              {iosStep === 2 && "Find the Share button"}
              {iosStep === 3 && "Add to Home Screen"}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {iosStep === 1 && "Look for the ( ... ) or ( AA ) in the address bar."}
              {iosStep === 2 && "Tap the 'Share' icon in the list."}
              {iosStep === 3 && "Scroll down to finalize the install."}
            </p>
          </div>

          <button 
            onClick={() => {
              if (iosStep < 3) setIosStep(iosStep + 1);
              else setShowInstructions(false);
            }}
            className="flex-shrink-0 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            {iosStep < 3 ? "Next" : "Done"}
          </button>
        </div>
      </div>

      {/* 3. The Pulsing Directional Arrow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="w-1 h-8 bg-gradient-to-t from-blue-600 to-transparent animate-pulse rounded-full" />
        <div className="w-4 h-4 bg-blue-600 rotate-45 rounded-sm" />
      </div>
    </div>
  </div>
)}
    </div>
  );
}