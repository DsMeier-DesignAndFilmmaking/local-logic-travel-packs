'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface Tier1DownloadProps {
  pack: TravelPack;
}

export default function Tier1Download({ pack }: Tier1DownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const { triggerInstall, canInstall } = usePWAInstall();

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    const checkStandalone = () => {
      const isSA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true;
      setIsStandalone(isSA);
    };

    async function checkExisting() {
      if (!pack?.city) return;
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) { 
        console.error('DB Check Error:', err); 
      }
    }
    
    checkStandalone();
    checkExisting();
  }, [pack?.city]);

  const handleMainAction = async () => {
    if (status === 'syncing') return;
  
    if (isMobile) {
      if (status === 'saved' && !isStandalone) {
        setShowSuccessModal(true);
        return;
      }
  
      setStatus('syncing');
      try {
        const timestamp = new Date().toISOString();
        const packToPersist = {
          ...pack,
          downloadedAt: timestamp,
          offlineReady: true
        };

        // 1. SAVE TO DISK
        await savePack(packToPersist);
  
        // 2. DISPATCH GLOBAL SYNC EVENT
        // This is the secret sauce that tells page.tsx "Close the landing page NOW"
        window.dispatchEvent(new CustomEvent('vault-sync-complete', { 
          detail: { city: pack.city, timestamp } 
        }));

        // 3. CACHE PRIMING
        if ('caches' in window) {
          try {
            const cache = await caches.open('pages-cache');
            await Promise.all([
              cache.add('/'),
              cache.add(window.location.pathname),
              cache.add('/?source=pwa')
            ]);
          } catch (e) { /* Fallback for private browsing */ }
        }
  
        if (canInstall) await triggerInstall();
  
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) {
        console.error("Sync failed:", err);
        setStatus('idle');
      }
    } else {
      // Logic for Desktop HTML Export...
      // [Keep your existing handleDesktopExport logic here]
    }
  };

  if (isStandalone) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">
          Sync Active
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95 
          ${status === 'saved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white/10 text-white border border-white/20'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'saved' ? 'bg-emerald-500' : 'bg-white/40'}`} />
        {status === 'syncing' ? 'Syncing...' : status === 'saved' ? 'Ready' : 'Offline Sync'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] p-8 pb-10 max-w-xl mx-auto w-full animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
              Persistence Ready
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Vault Deployed.</h2>
            
            <div className="space-y-3 mb-10">
              {[
                { s: 1, t: 'Tap Share', i: '📤' },
                { s: 2, t: 'Add to Home Screen', i: '➕' },
                { s: 3, t: 'Launch from Device', i: '📱' }
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white bg-slate-900 text-xs">
                    {item.s}
                  </div>
                  <p className="text-sm font-bold text-slate-800 flex-1">{item.t}</p>
                  <span className="text-xl">{item.i}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
            >
              Continue to Vault
            </button>
          </div>
        </div>
      )}
    </>
  );
}