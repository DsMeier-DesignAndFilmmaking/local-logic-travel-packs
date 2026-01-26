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
  const { triggerInstall, canInstall } = usePWAInstall();

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    const checkDB = async () => {
      const existing = await getPack(pack.city);
      if (existing) setStatus('saved');
    };
    checkDB();
  }, [pack.city]);

  const generateHighFidelityHTML = () => {
    // 1. Prepare Data for the Template
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];

    const payload = {
      city: pack.city,
      country: pack.country,
      cards: cards, // Sending the full deep structure
      timestamp: new Date().toLocaleString()
    };

    // 2. The Interactive UI Template (Replicating PWA UX)
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${payload.city} | Tactical Vault</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #10b981; --text: #f8fafc; --muted: #94a3b8; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 0; }
        .app-shell { max-width: 500px; margin: 0 auto; min-height: 100vh; padding: 40px 20px 100px 20px; }
        header { margin-bottom: 32px; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.1); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        h1 { font-size: 42px; font-weight: 900; margin: 0; letter-spacing: -0.04em; }
        .loc { font-size: 18px; color: var(--muted); margin-top: 4px; font-weight: 600; }
        
        /* Tactical Card UI */
        .problem-group { margin-bottom: 24px; }
        .headline { font-size: 14px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; padding-left: 4px; display: flex; align-items: center; gap: 8px; }
        .headline::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        
        .situation-card { background: var(--card); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .sit-title { font-size: 17px; font-weight: 700; color: var(--accent); margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .sit-title::before { content: ""; width: 3px; height: 16px; background: var(--accent); border-radius: 4px; }
        
        .action-list { margin: 0; padding: 0; list-style: none; }
        .action-item { font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: #cbd5e1; display: flex; gap: 10px; }
        .action-item:last-child { border: none; }
        .action-item::before { content: "→"; color: var(--accent); font-weight: bold; }
        
        .note-box { margin-top: 12px; padding: 12px; background: rgba(16, 185, 129, 0.05); border-radius: 12px; font-size: 13px; color: var(--accent); font-style: italic; border-left: 2px solid var(--accent); }
        
        footer { text-align: center; color: var(--muted); font-size: 10px; font-weight: 700; margin-top: 40px; opacity: 0.5; }
    </style>
</head>
<body>
    <div class="app-shell">
        <header>
            <div class="badge">Tactical Asset Locked</div>
            <h1>${payload.city.toUpperCase()}</h1>
            <div class="loc">${payload.country}</div>
        </header>
        <div id="vault-root"></div>
        <footer>REF: ${payload.city.substring(0,3).toUpperCase()}-OFL | GEN: ${payload.timestamp}</footer>
    </div>

    <script>
        (function() {
            const data = ${JSON.stringify(payload)};
            const root = document.getElementById('vault-root');
            
            data.cards.forEach(card => {
                const group = document.createElement('div');
                group.className = 'problem-group';
                group.innerHTML = '<div class="headline">' + card.headline + '</div>';
                
                card.microSituations.forEach(ms => {
                    const sit = document.createElement('div');
                    sit.className = 'situation-card';
                    
                    let actionsHtml = ms.actions.map(a => '<div class="action-item">' + a + '</div>').join('');
                    let noteHtml = ms.whatToDoInstead ? '<div class="note-box">' + ms.whatToDoInstead + '</div>' : '';
                    
                    sit.innerHTML = \`
                        <div class="sit-title">\${ms.title}</div>
                        <div class="action-list">\${actionsHtml}</div>
                        \${noteHtml}
                    \`;
                    group.appendChild(sit);
                });
                root.appendChild(group);
            });
        })();
    </script>
</body>
</html>`;
  };

  const handleAction = async () => {
    setStatus('syncing');
    try {
      // 1. Always Sync to Local Database first (Mobile & Desktop)
      await savePack({ ...pack, downloadedAt: new Date().toISOString() });
      
      if (isMobile) {
        // Mobile UX: Add to home screen and redirect
        if (canInstall) await triggerInstall();
        setStatus('saved');
        setShowSuccessModal(true);
      } else {
        // Desktop UX: High-Fidelity File Export
        const html = generateHighFidelityHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pack.city}_Vault_Offline.html`;
        a.click();
        setStatus('saved');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

    return (
      <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900">
              Tactical Storage
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {status === 'saved' ? 'Vault is encrypted & offline-ready' : 'No local data detected'}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${status === 'saved' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        </div>
    
        <button
          onClick={handleAction}
          disabled={status === 'syncing'}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3
            ${status === 'saved' 
              ? 'bg-white text-emerald-600 border-2 border-emerald-100 shadow-sm' 
              : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
        >
          {status === 'syncing' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Syncing...
            </>
          ) : status === 'saved' ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Open Offline Vault
            </>
          ) : (
            'Secure for Offline Use'
          )}
        </button>
      </div>
    );
}