'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface Tier1DownloadProps {
  pack: TravelPack;
}

export default function Tier1Download({ pack }: Tier1DownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState<'success' | 'instructions'>('success');
  const [showInstructions, setShowInstructions] = useState(false);
  // Add this state to track which step of the iOS menu they are in
  const [iosStep, setIosStep] = useState(1);
  const [isReady, setIsReady] = useState(false);
  
  const { triggerInstall, canInstall } = usePWAInstall();

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
    if (!pack.tiers?.tier1 || status !== 'idle') return;
    setStatus('syncing');

    const downloadData = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: { tier1: pack.tiers.tier1 },
    };

    try {
      await savePack(downloadData);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (canInstall) {
        await triggerInstall();
      }

      setStatus('saved');
      setShowSuccessModal(true); 
    } catch (err) {
      console.error('Failed to sync:', err);
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
      // SUCCESS: These now run independently
      setShowSuccessModal(false);
      setShowInstructions(true);
    } else {
      setShowSuccessModal(false);
      window.location.href = '/?mode=standalone';
    }
  };

  if (!pack.tiers?.tier1) return null;

  const config = {
    idle: {
      text: "Download Offline File",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "rgba(255, 255, 255, 0.15)",
      textColor: "var(--text-on-dark)"
    },
    syncing: {
      text: "Syncing...",
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      bg: "rgba(255, 255, 255, 0.1)",
      textColor: "rgba(255, 255, 255, 0.7)"
    },
    saved: {
      text: "Available Offline",
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      bg: "rgba(16, 185, 129, 0.2)",
      textColor: "#A7F3D0"
    }
  };

  const current = config[status];

  return (
    <>
      <button
        onClick={handleSync}
        disabled={status !== 'idle'}
        className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium flex items-center gap-2 text-sm"
        style={{ 
          minHeight: '36px', 
          backgroundColor: current.bg, 
          color: current.textColor,
          border: status === 'saved' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.3)',
          cursor: status === 'idle' ? 'pointer' : 'default'
        }}
      >
        {current.icon}
        {current.text}
      </button>

      {/* SUCCESS CONFIRMATION MODAL */}
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
                  Confirm & Add App to Home Screen
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
                    <span>Tap the <strong className="text-blue-600">Share</strong> icon</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
                    <span>Tap <strong className="text-slate-900">Add to Home Screen</strong></span>
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

{/* FLOATING INSTRUCTIONS - Moved outside of the modal block */}
{showInstructions && (
  <div className="fixed inset-0 z-[130] bg-slate-900 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
    <div className="max-w-xs w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black mb-2">Tactical Install</h2>
        <p className="text-slate-400 text-sm">Follow these 3 taps exactly</p>
      </div>

      {/* The Visual Sequence */}
      <div className="space-y-3 mb-10">
        {[
          { step: 1, text: "Tap the '...' or 'AA' icon", sub: "Bottom of screen" },
          { step: 2, text: "Select 'Share'", sub: "In the popup menu" },
          { step: 3, text: "Select 'Add to Home Screen'", sub: "You may need to tap '... More' first" }
        ].map((item) => (
          <div key={item.step} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
              {item.step}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{item.text}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="space-y-4">
        <button 
          onClick={() => {
            // This closes the UI so they can see the browser bars to start tapping
            setShowInstructions(false);
            // Optional: add a small toast that says "TAPPING NOW"
          }}
          className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
        >
          START INSTALLATION
        </button>
        
        <button 
          onClick={() => setShowInstructions(false)}
          className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>

    {/* Footer Detail */}
    <div className="absolute bottom-10 flex flex-col items-center animate-bounce">
      <p className="text-[10px] text-slate-600 font-bold mb-2 uppercase tracking-tighter">Instructions will close so you can tap</p>
      <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
)}
    </>
  );
}