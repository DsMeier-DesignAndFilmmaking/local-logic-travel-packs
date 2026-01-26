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
    
    // 1. DATA EXTRACTION & CLEANING (The Expert Serialization Bridge)
    const rawPack = pack as any;
    const rawSections = rawPack.tiers?.tier1?.sections || rawPack.sections || [];
    
    // Flatten data to ensure no Proxy objects or complex getters are stringified
    const cleanSections = Array.isArray(rawSections) 
      ? rawSections.map((s: any) => ({
          title: String(s.title || 'Untitled Section'),
          content: String(s.content || '')
        }))
      : [];

    const cityData = {
      city: rawPack.city || 'Tactical',
      country: rawPack.country || 'Vault',
      sections: cleanSections,
      generatedAt: new Date().toLocaleString()
    };

    // 2. THE HIGH-FIDELITY OFFLINE APP TEMPLATE
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
        header { margin-bottom: 40px; padding-top: 20px; }
        .tag { color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .tag::before { content: ""; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 8px var(--accent); }
        h1 { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 1; }
        .country { color: var(--muted); font-size: 18px; font-weight: 600; margin-top: 4px; }
        .card { background: var(--card); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; margin-bottom: 20px; backdrop-filter: blur(10px); animation: fadeIn 0.5s ease forwards; opacity: 0; }
        .card-title { color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .card-title::before { content: ""; width: 2px; height: 12px; background: var(--accent); border-radius: 2px; }
        .card-content { font-size: 15px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; }
        footer { margin-top: 60px; padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; font-size: 9px; color: var(--muted); font-weight: 800; letter-spacing: 0.1em; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="app-shell">
        <header>
            <span class="tag">Verified Asset</span>
            <h1>${cityData.city.toUpperCase()}</h1>
            <div class="country">${cityData.country}</div>
        </header>
        <div id="content"></div>
        <footer>
            REF: ${cityData.city.substring(0, 3).toUpperCase()}-OFL-SECURE | DEPLOYED: ${cityData.generatedAt}
        </footer>
    </div>

    <script>
        (function() {
            const appData = ${JSON.stringify(cityData)};
            const container = document.getElementById('content');

            if (appData.sections && appData.sections.length > 0) {
                appData.sections.forEach((section, i) => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.style.animationDelay = (i * 0.1) + 's';
                    div.innerHTML = \`
                        <div class="card-title">\${section.title}</div>
                        <div class="card-content">\${section.content}</div>
                    \`;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<div class="card" style="opacity:1"><div class="card-title">Error</div><div class="card-content">No tactical data found in vault.</div></div>';
            }
        })();
    </script>
</body>
</html>`;

    // 3. SECURE FILE SAVING
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

  const handleMobileSync = async () => {
    setStatus('syncing');
    try {
      await savePack({ ...pack, downloadedAt: new Date().toISOString() });
      if (canInstall) await triggerInstall();
      setStatus('saved');
      setShowSuccessModal(true);
    } catch (err) {
      setStatus('idle');
    }
  };

  const handleMainAction = async () => { // Added async
    if (isMobile) {
      if (status === 'saved') {
        // Direct navigation to the offline-enabled route
        window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        // We don't just call handleMobileSync; we await it to ensure DB write
        setStatus('syncing');
        try {
          // 1. Physical Save to IndexedDB
          await savePack({ 
            ...pack, 
            downloadedAt: new Date().toISOString(),
            offlineReady: true 
          });
  
          // 2. Trigger PWA Install (if available)
          if (canInstall) await triggerInstall();
  
          // 3. Success State
          setStatus('saved');
          setShowSuccessModal(true);
        } catch (err) {
          console.error("Sync failed:", err);
          setStatus('idle');
        }
      }
    } else {
      // Desktop still triggers the high-fidelity HTML export
      handleDesktopExport();
    }
  };

  return (
    <>
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`w-full px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 
          ${status === 'saved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-900 border border-slate-200 shadow-lg'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {status === 'syncing' ? 'Encrypting...' : status === 'saved' ? 'Open Offline Pack' : 'Download Offline Vault'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black mb-2">{isMobile ? 'Vault Synced' : 'Vault Exported'}</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
              {isMobile ? 'Tactical data is now cached locally.' : 'Your interactive standalone vault is ready for offline use.'}
            </p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95">Return</button>
          </div>
        </div>
      )}
    </>
  );
}