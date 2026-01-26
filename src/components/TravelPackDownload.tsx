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
    
    // Check if app is already "installed" and running as a standalone app
    const checkStandalone = () => {
      const isSAtandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
      setIsStandalone(isSAtandalone);
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

  const generateHighFidelityHTML = () => {
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];
    const payload = {
      city: pack.city,
      country: pack.country,
      cards: cards,
      timestamp: new Date().toLocaleString()
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${payload.city} | Tactical Vault</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #10b981; --text: #f8fafc; --muted: #94a3b8; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .shell { max-width: 500px; margin: 0 auto; padding-bottom: 50px; }
        .badge { background: rgba(16, 185, 129, 0.1); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        h1 { font-size: 42px; margin: 10px 0 0 0; }
        .card { background: var(--card); border-radius: 20px; padding: 20px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .headline { font-size: 12px; color: var(--accent); font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-left: 3px solid var(--accent); padding-left: 10px; }
        .action { font-size: 14px; margin: 8px 0; color: #cbd5e1; display: flex; gap: 8px; }
        .action::before { content: "•"; color: var(--accent); }
    </style>
</head>
<body>
    <div class="shell">
        <div class="badge">Offline Vault</div>
        <h1>${payload.city.toUpperCase()}</h1>
        <div id="root"></div>
    </div>
    <script>
        const data = ${JSON.stringify(payload)};
        const root = document.getElementById('root');
        data.cards.forEach(card => {
            card.microSituations.forEach(ms => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = '<div class="headline">' + card.headline + ' > ' + ms.title + '</div>' + 
                                ms.actions.map(a => '<div class="action">' + a + '</div>').join('');
                root.appendChild(div);
            });
        });
    </script>
</body>
</html>`;
  };

  const handleMainAction = async () => {
    if (status === 'syncing') return;

    if (isMobile) {
      // Logic for already saved packs: Show instructions if in Safari, do nothing if already in App
      if (status === 'saved' && !showSuccessModal) {
        if (!isStandalone) {
          setShowSuccessModal(true);
        }
        return;
      }

      setStatus('syncing');
      try {
        // 1. Persist Raw Data to IndexedDB (for the dynamic components)
        await savePack({ ...pack, downloadedAt: new Date().toISOString() });
        
        // 2. FORCE CACHE THE HTML SHELL (The "First Run" Fix)
        // We open the specific cache used by next-pwa and manually add the current route
        if ('caches' in window) {
          try {
            const cache = await caches.open('pages-cache');
            // Cache both the Home page and the specific city page
            await Promise.all([
              cache.add('/'),
              cache.add(window.location.pathname),
              cache.add('/?source=pwa')
            ]);
            console.log('🛡️ Tactical Shell Primed: Routes stored in pages-cache');
          } catch (cacheErr) {
            console.warn('Cache priming skipped:', cacheErr);
            // We continue anyway as savePack succeeded
          }
        }

        // 3. Trigger Installation logic
        if (canInstall) {
          await triggerInstall();
        }
        
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { 
        console.error('Sync error:', err);
        setStatus('idle'); 
      }
    } else {
      // Desktop Export Logic (Generates standalone HTML file)
      setStatus('syncing');
      try {
        const html = generateHighFidelityHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pack.city}_Tactical_Vault.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) {
        console.error('Export error:', err);
        setStatus('idle');
      }
    }
  };

  // Standalone mode view (Hide button when running as a pinned Home Screen app)
  if (isStandalone) {
    return (
      <div className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl flex items-center justify-between">
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
    <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900">
            Tactical Storage
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {status === 'saved' ? 'Data encrypted & ready for install' : 'Ready for local deployment'}
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
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div>
                    <p className="text-xs font-black uppercase text-slate-400">Step 1</p>
                    <p className="text-sm font-bold text-slate-800">Tap the <span className="text-blue-600">Share Icon</span> at the bottom of Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">
                    +
                </div>
                <div>
                    <p className="text-xs font-black uppercase text-slate-400">Step 2</p>
                    <p className="text-sm font-bold text-slate-800">Scroll down and select <span className="text-slate-900">"Add to Home Screen"</span>.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                    <p className="text-xs font-black uppercase text-emerald-400">Step 3</p>
                    <p className="text-sm font-bold text-emerald-900">Launch the <span className="font-black italic">Vault Icon</span> from your phone.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              Close Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}