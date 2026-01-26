'use client';

import { useState, useEffect, useRef } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface Tier1DownloadProps {
  pack: TravelPack;
}

export default function Tier1Download({ pack }: Tier1DownloadProps) {
  // --- STATE ---
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [iosStep, setIosStep] = useState<1 | 2>(1); // Simplified to 2-step checklist logic
  
  const lastJumpRef = useRef(0);
  const { triggerInstall, canInstall } = usePWAInstall();

  // --- INITIALIZATION ---
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

  // --- DESKTOP DOWNLOAD LOGIC ---
  const handleDesktopDownload = async () => {
    try {
      setStatus('syncing');
      const fileData = JSON.stringify(pack, null, 2);
      const blob = new Blob([fileData], { type: 'application/json' });
      const fileName = `${pack.city.replace(/\s+/g, '_')}_Tactical_Pack.json`;

      // Use File System Access API if available
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Tactical Pack', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback for older desktop browsers
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      setStatus('saved');
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Download cancelled or failed", err);
      setStatus('idle');
    }
  };

  // --- SYNC LOGIC ---
  const handleSync = async () => {
    if (!pack.tiers?.tier1 || status !== 'idle') return;
    
    // If Desktop, we trigger the file download flow immediately
    if (!isMobile) {
      handleDesktopDownload();
      return;
    }

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

  // --- APP LAUNCH / INSTALL LOGIC ---
  const handleLaunchApp = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
  
    if (isStandalone || !isMobile) {
      setShowSuccessModal(false);
      if (isStandalone) window.location.reload();
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      setShowSuccessModal(false);
      setShowInstructions(true);
    } else {
      setShowSuccessModal(false);
      window.location.href = '/?mode=standalone';
    }
  };

  // --- IOS AUTO-INSTRUCTION LOGIC ---
  useEffect(() => {
    let lastHeight = window.innerHeight;

    const advance = () => {
      const now = Date.now();
      if (now - lastJumpRef.current < 900) return;
      if (showInstructions && iosStep === 1) {
        lastJumpRef.current = now;
        setIosStep(2);
      }
    };

    const handleResize = () => {
      if (window.innerHeight !== lastHeight) {
        advance();
        lastHeight = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', advance);
    document.addEventListener('visibilitychange', advance);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', advance);
      document.removeEventListener('visibilitychange', advance);
    };
  }, [showInstructions, iosStep]);

  // --- UI CONFIG ---
  if (!pack.tiers?.tier1) return null;

  const config = {
    idle: {
      text: isMobile ? "Download Offline File" : "Save Tactical File",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      bg: "rgba(255, 255, 255, 0.15)",
      textColor: "var(--text-on-dark)"
    },
    syncing: {
      text: "Syncing...",
      icon: <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
      bg: "rgba(255, 255, 255, 0.1)",
      textColor: "rgba(255, 255, 255, 0.7)"
    },
    saved: {
      text: "Available Offline",
      icon: <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
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

      {/* SUCCESS MODAL (STYLING VARIES BY DEVICE) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`${isMobile ? 'bg-white text-slate-900' : 'bg-slate-900 text-white border border-emerald-500/30'} rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center`}>
            <div className={`w-20 h-20 ${isMobile ? 'bg-emerald-100' : 'bg-emerald-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <svg className={`w-10 h-10 ${isMobile ? 'text-emerald-600' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black mb-2">{isMobile ? 'Sync Complete' : 'File Saved'}</h2>
            <p className={`${isMobile ? 'text-slate-600' : 'text-slate-400'} text-sm mb-8 px-2`}>
              {isMobile 
                ? 'Tactical data is now locked in your local vault.' 
                : 'Your tactical pack has been exported. Check your Downloads folder to import it into your desktop app.'}
            </p>

            <button 
              onClick={handleLaunchApp}
              className={`w-full py-4 ${isMobile ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-slate-900'} rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all`}
            >
              {isMobile ? 'Add App to Home Screen' : 'Return to Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/* IOS TOP-FLOATING TACTICAL CHECKLIST */}
      {showInstructions && (
        <div className="fixed inset-x-0 top-0 z-[160] p-4 pt-12 pointer-events-none">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md -z-10" />
          <div className="bg-slate-900 border border-white/20 rounded-[32px] shadow-2xl overflow-hidden max-w-sm mx-auto pointer-events-auto ring-1 ring-white/10 p-6">
            
            <div className="flex h-1.5 w-full bg-white/10 gap-1 p-1 mb-6 rounded-full">
              <div className="h-full flex-1 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              <div className={`h-full flex-1 rounded-full transition-all duration-500 ${iosStep === 2 ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-white/5'}`} />
            </div>

            {iosStep === 1 ? (
              <div className="flex items-center gap-4 animate-in slide-in-from-left duration-300">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
                  <span className="text-emerald-400 font-black text-xl">1</span>
                </div>
                <h3 className="text-white font-bold text-lg">Tap the browser bar below</h3>
              </div>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Final Checklist</p>
                  <button onClick={() => setShowInstructions(false)} className="text-white/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} strokeLinecap="round" /></svg></button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">2</div>
                    <p className="text-white text-sm font-medium">Tap <span className="text-emerald-400 font-bold">'AA'</span> or <span className="text-emerald-400 font-bold">'...'</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">3</div>
                    <p className="text-white text-sm font-medium">Select the <span className="text-emerald-400 font-bold">'Share'</span> icon</p>
                  </div>
                  <div className="flex items-start gap-3 pb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">4</div>
                    <p className="text-white text-sm font-medium">Find <span className="text-emerald-400 font-bold">'Add to Home Screen'</span></p>
                  </div>
                </div>

                <button onClick={() => setShowInstructions(false)} className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">I'm Done</button>
              </div>
            )}
          </div>

          {iosStep === 1 && (
            <div className="flex flex-col items-center mt-8 animate-bounce">
              <div className="w-px h-12 bg-gradient-to-b from-emerald-500 to-transparent" />
              <div className="bg-emerald-500 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg -mt-1">Tap Below</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}