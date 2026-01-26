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
        // 1. TIMESTAMP & PERSIST
        const timestamp = new Date().toISOString();
        const packToPersist = { 
          ...pack, 
          downloadedAt: timestamp,
          offlineReady: true 
        };

        await savePack(packToPersist);

        // 2. BROADCAST SYNC (The "Anti-Double Spontaneity" Trigger)
        // This notifies page.tsx to refresh its state immediately
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
          } catch (e) { /* Cache fails silently in some private modes */ }
        }

        if (canInstall) await triggerInstall();
        
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { 
        console.error('Sync error:', err);
        setStatus('idle'); 
      }
    } else {
      // Desktop Fallback
      setStatus('syncing');
      const payload = { ...pack, exportedAt: new Date().toLocaleString() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pack.city}_Vault.json`;
      link.click();
      setStatus('saved');
    }
  };

  // PWA Mode: "Verified" Dashboard View
  if (isStandalone) {
    return (
      <div className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">System Secure</p>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Offline Asset Verified</h4>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900">Tactical Storage</h4>
          <p className="text-xs text-slate-500 font-medium">
            {status === 'saved' ? 'Encryption verified' : 'Ready for deployment'}
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
        {status === 'syncing' ? 'Syncing...' : status === 'saved' ? 'Install Instructions' : 'Secure for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-500 max-w-xl mx-auto w-full">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="mb-6 text-center">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Sync Complete</div>
                <h2 className="text-3xl font-black text-slate-900">Deployment Ready</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Access this vault from your home screen.</p>
            </div>
            
            <div className="space-y-3 mb-8">
              {[
                { s: 1, t: 'Tap Share Icon', i: '📤' },
                { s: 2, t: 'Add to Home Screen', i: '➕' },
                { s: 3, t: 'Launch Vault Icon', i: '📱' }
              ].map((step) => (
                <div key={step.s} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">{step.s}</div>
                    <p className="flex-1 text-sm font-bold text-slate-900 uppercase">{step.t}</p>
                    <span>{step.i}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowSuccessModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}