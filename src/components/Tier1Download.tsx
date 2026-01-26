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
  const [isStandalone, setIsStandalone] = useState(false);
  
  const { triggerInstall, canInstall } = usePWAInstall();

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    // Check if app is running as a standalone PWA
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

  const handleDesktopExport = async () => {
    setStatus('syncing');
    
    const rawPack = pack as any;
    const tier1 = rawPack.tiers?.tier1;
    const cards = tier1?.cards || [];
    
    const cityData = {
      city: rawPack.city || 'Tactical',
      country: rawPack.country || 'Vault',
      cards: cards,
      generatedAt: new Date().toLocaleString()
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cityData.city} | Tactical Vault</title>
    <style>
        :root { --bg: #020617; --card: rgba(30, 41, 59, 0.5); --accent: #10b981; --text: #f8fafc; --muted: #94a3b8; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; justify-content: center; }
        .app-shell { width: 100%; max-width: 450px; min-height: 100vh; padding: 40px 24px; box-sizing: border-box; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; }
        .tag { color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .tag::before { content: ""; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
        h1 { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: -0.05em; }
        .card { background: var(--card); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; margin-top: 24px; backdrop-filter: blur(10px); }
        .headline { color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
        .action { font-size: 14px; margin: 8px 0; color: #cbd5e1; display: flex; gap: 8px; }
    </style>
</head>
<body>
    <div class="app-shell">
        <div class="tag">Verified Offline Asset</div>
        <h1>${cityData.city.toUpperCase()}</h1>
        <div id="content"></div>
    </div>
    <script>
        const data = ${JSON.stringify(cityData)};
        const container = document.getElementById('content');
        data.cards.forEach(card => {
            card.microSituations.forEach(ms => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = \`<div class="headline">\${card.headline} > \${ms.title}</div>\` + 
                                ms.actions.map(a => \`<div class="action">• \${a}</div>\`).join('');
                container.appendChild(div);
            });
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cityData.city}_Tactical_Vault.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus('saved');
    setShowSuccessModal(true);
  };

  const handleMainAction = async () => {
    if (status === 'syncing') return;
  
    if (isMobile) {
      if (status === 'saved') {
        if (!isStandalone) {
          setShowSuccessModal(true);
        } else {
          window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`;
        }
        return;
      }
  
      setStatus('syncing');
      try {
        // Step A: IndexedDB Save
        await savePack({ 
          ...pack, 
          downloadedAt: new Date().toISOString(),
          offlineReady: true 
        });
  
        // Step B: Cache Priming for iPhone SE
        if ('caches' in window) {
          try {
            const cache = await caches.open('pages-cache');
            await Promise.all([
              cache.add('/'),
              cache.add(window.location.pathname),
              cache.add('/?source=pwa')
            ]);
          } catch (e) { console.warn('Cache priming failed'); }
        }
  
        if (canInstall) await triggerInstall();
  
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) {
        console.error("Sync failed:", err);
        setStatus('idle');
      }
    } else {
      handleDesktopExport();
    }
  };

  // If already installed and running, we can simplify this button
  if (isStandalone) {
    return (
      <button
        onClick={() => window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`}
        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20"
      >
        Verified Vault Active
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all active:scale-95 
          ${status === 'saved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-900 border border-slate-200 shadow-sm'}`}
      >
        <div className={`w-2 h-2 rounded-full ${status === 'saved' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        {status === 'syncing' ? 'Syncing...' : status === 'saved' ? 'Ready for PWA' : 'Offline Sync'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] p-8 pb-10 max-w-xl mx-auto w-full animate-in slide-in-from-bottom-full duration-500">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">Vault Synced</h2>
            <p className="text-slate-500 mb-8 font-medium">To access this {pack.city} pack offline:</p>
            
            <div className="space-y-4 mb-8">
              {[
                { step: 1, text: 'Tap the "Share" icon in Safari', color: 'blue' },
                { step: 2, text: 'Select "Add to Home Screen"', color: 'slate' },
                { step: 3, text: 'Launch from your home screen', color: 'emerald' }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${item.step === 3 ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                    {item.step}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{item.text}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setShowSuccessModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}