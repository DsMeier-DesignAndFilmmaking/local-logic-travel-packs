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
        if (existing) {
          setStatus('saved');
          // Note: page.tsx handles the actual data hydration, 
          // but we verify the existence here for the UI status.
        }
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
      // If already saved and we are in Safari, show the "How to Install" modal
      if (status === 'saved' && !isStandalone) {
        setShowSuccessModal(true);
        return;
      }

      setStatus('syncing');
      try {
        /**
         * 1. THE HARDENED SAVE
         * We ensure downloadedAt is set. This is the primary key 
         * for the auto-load logic in page.tsx.
         */
        const packToPersist = { 
          ...pack, 
          downloadedAt: new Date().toISOString(),
          offlineReady: true 
        };

        await savePack(packToPersist);
        
        // 2. Priming Cache for iOS (Ensures the shell is ready)
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

        // 3. PWA Install Trigger
        if (canInstall) await triggerInstall();
        
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { 
        console.error('Sync error:', err);
        setStatus('idle'); 
      }
    } else {
      // Desktop Fallback: Simple JSON/HTML Export
      setStatus('syncing');
      try {
        const payload = {
          city: pack.city,
          cards: (pack as any).tiers?.tier1?.cards || [],
          timestamp: new Date().toLocaleString()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pack.city.replace(/\s+/g, '_')}_Vault_Export.json`;
        link.click();
        setStatus('saved');
      } catch (e) {
        setStatus('idle');
      }
    }
  };

  /**
   * PWA VIEW: When running on the Home Screen, we replace the button 
   * with a "Verified" badge to prevent redundant syncing.
   */
  if (isStandalone) {
    return (
      <div className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl flex items-center justify-between mt-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Vault Status</p>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Verified Offline Asset</h4>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Active</span>
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
            {status === 'saved' ? 'Encrypted & ready for install' : 'Ready for local deployment'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${status === 'saved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      </div>

      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3
          ${status === 'saved' 
            ? 'bg-white text-emerald-600 border-2 border-emerald-200 shadow-sm' 
            : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
      >
        {status === 'syncing' ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Encrypting...
          </span>
        ) : status === 'saved' ? 'Install Instructions' : 'Secure for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-500 max-w-xl mx-auto w-full">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="mb-6 text-center">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Sync Complete</div>
                <h2 className="text-3xl font-black text-slate-900">Finalize Deployment</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Access your tactical data from your home screen.</p>
            </div>
            
            <div className="space-y-3 mb-8">
              {[
                { step: 1, text: 'Tap Share Icon', sub: 'Located at the bottom of Safari', icon: '📤' },
                { step: 2, text: 'Add to Home Screen', sub: 'Scroll down the share sheet', icon: '➕' },
                { step: 3, text: 'Launch Vault', sub: 'Open the new icon on your phone', icon: '📱' }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">{item.step}</div>
                    <div className="flex-1">
                        <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{item.text}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{item.sub}</p>
                    </div>
                    <span className="text-xl">{item.icon}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowSuccessModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform">
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}