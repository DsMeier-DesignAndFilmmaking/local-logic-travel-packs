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
    async function checkExisting() {
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) { console.error('DB Check Error:', err); }
    }
    checkExisting();
  }, [pack.city]);

  const handleDesktopExport = async () => {
    setStatus('syncing');

    // 1. ROBUST DATA EXTRACTION (Expert Logic)
    // Deep-cloning the sections to ensure no React proxies break the serialization
    const rawPack = pack as any;
    const rawSections = rawPack.tiers?.tier1?.sections || rawPack.sections || [];
    
    const cleanSections = Array.isArray(rawSections) 
      ? rawSections.map((s: any) => ({
          title: String(s.title || 'Untitled'),
          content: String(s.content || '')
        }))
      : [];

    const cityData = {
      city: rawPack.city || 'Tactical',
      country: rawPack.country || 'Vault',
      sections: cleanSections,
      timestamp: new Date().toLocaleString()
    };

    // 2. SELF-CONTAINED HTML (No Tailwind Dependency)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cityData.city} | Tactical Vault</title>
    <style>
        :root { --bg: #020617; --card: rgba(30, 41, 59, 0.4); --accent: #10b981; --text: #f8fafc; --muted: #94a3b8; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; justify-content: center; }
        .app-shell { width: 100%; max-width: 450px; min-height: 100vh; padding: 40px 24px; box-sizing: border-box; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; position: relative; }
        header { margin-bottom: 48px; padding-top: 20px; }
        .indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
        .tag { font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
        h1 { font-size: 56px; font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 0.9; }
        .country { font-size: 20px; color: var(--muted); font-weight: 700; margin-top: 8px; }
        .card { background: var(--card); border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 28px; margin-bottom: 20px; backdrop-filter: blur(12px); animation: slideUp 0.5s ease forwards; opacity: 0; }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .line { width: 3px; height: 16px; background: var(--accent); border-radius: 4px; }
        .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: var(--accent); }
        .card-content { font-size: 15px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; }
        footer { margin-top: 60px; padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 9px; color: var(--muted); font-weight: 800; letter-spacing: 0.1em; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="app-shell">
        <header>
            <div class="indicator"><div class="dot"></div><span class="tag">Offline Deployment</span></div>
            <h1>${cityData.city.toUpperCase()}</h1>
            <div class="country">${cityData.country}</div>
        </header>
        <div id="content"></div>
        <footer>
            REF: ${cityData.city.substring(0, 3).toUpperCase()}-OFL-VAULT | GENERATED: ${cityData.timestamp}
        </footer>
    </div>
    <script>
        (function() {
            const data = ${JSON.stringify(cityData)};
            const container = document.getElementById('content');
            if (!data.sections || data.sections.length === 0) {
                container.innerHTML = '<div class="card" style="opacity:1"><div class="card-title">Empty Vault</div><div class="card-content">No tactical data found in this package.</div></div>';
                return;
            }
            data.sections.forEach((s, i) => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style.animationDelay = (i * 0.1) + 's';
                div.innerHTML = \`<div class="card-header"><div class="line"></div><div class="card-title">\${s.title}</div></div><div class="card-content">\${s.content}</div>\`;
                container.appendChild(div);
            });
        })();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cityData.city.replace(/\s+/g, '_')}_Tactical_Vault.html`;
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
        window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        setStatus('syncing');
        try {
          await savePack({ ...pack, downloadedAt: new Date().toISOString() });
          if (canInstall) await triggerInstall();
          setStatus('saved');
          setShowSuccessModal(true);
        } catch (err) { setStatus('idle'); }
      }
    } else {
      handleDesktopExport();
    }
  };

  return (
    <div className="w-full space-y-3">
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`w-full px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] 
          ${status === 'saved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
      >
        {status === 'syncing' ? 'Encrypting...' : status === 'saved' ? 'Open Offline Pack' : 'Download for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-2">{isMobile ? 'Vault Synced' : 'Vault Exported'}</h2>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed">
              {isMobile ? 'Data is now locked in your local vault.' : 'Your interactive standalone guide has been generated for desktop use.'}
            </p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95">
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}