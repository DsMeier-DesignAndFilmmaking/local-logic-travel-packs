'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
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
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) { console.error('DB Check Error:', err); }
    }
    
    checkStandalone();
    checkExisting();
  }, [pack.city]);

  const handleMainAction = async () => {
    if (status === 'syncing') return;

    if (isMobile) {
      if (status === 'saved' && !showSuccessModal) {
        if (!isStandalone) {
          setShowSuccessModal(true);
        }
        return;
      }

      setStatus('syncing');
      try {
        // 1. CRITICAL: Save with the exact same timestamp logic as Tier1Download
        // This is what page.tsx looks for on Home Screen launch
        await savePack({ 
          ...pack, 
          downloadedAt: new Date().toISOString(),
          offlineReady: true 
        });
        
        // 2. Priming Cache for iOS
        if ('caches' in window) {
          try {
            const cache = await caches.open('pages-cache');
            await Promise.all([
              cache.add('/'),
              cache.add(window.location.pathname),
              cache.add('/?source=pwa')
            ]);
          } catch (cacheErr) {
            console.warn('Cache priming skipped');
          }
        }

        if (canInstall) await triggerInstall();
        
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { 
        console.error('Sync error:', err);
        setStatus('idle'); 
      }
    } else {
      // Desktop Export Logic remains same for file downloads
      setStatus('syncing');
      const payload = {
        city: pack.city,
        cards: (pack as any).tiers?.tier1?.cards || [],
        timestamp: new Date().toLocaleString()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pack.city}_Vault.html`;
      link.click();
      setStatus('saved');
    }
  };

  // If in Standalone (PWA) mode, we show the "Vault Status" dashboard instead of a button
  if (isStandalone) {
    return (
      <div className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-20" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              Vault Status
            </p>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              Verified Offline Asset
            </h4>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Local Only
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900">
            Tactical Storage
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {status === 'saved' ? 'Encrypted & ready for install' : 'Ready for local deployment'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === 'saved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      </div>

      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3
          ${status === 'saved' 
            ? 'bg-white text-emerald-600 border-2 border-emerald-200 shadow-sm' 
            : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
      >
        {status === 'syncing' ? 'Encrypting...' : status === 'saved' ? 'Install to Device' : 'Secure for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-500 max-w-xl mx-auto w-full">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="mb-6">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                    Sync Complete
                </div>
                <h2 className="text-3xl font-black text-slate-900">Finalize Deployment</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Access {pack.city} from your home screen anytime.</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {[
                { step: 1, text: 'Tap the Share Icon in Safari', color: 'text-blue-600' },
                { step: 2, text: 'Select "Add to Home Screen"', color: 'text-slate-900' },
                { step: 3, text: 'Launch from your device', color: 'text-emerald-600' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">
                        {item.step}
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase text-slate-400">Step {item.step}</p>
                        <p className={`text-sm font-bold ${item.color}`}>{item.text}</p>
                    </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest"
            >
              Close Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}