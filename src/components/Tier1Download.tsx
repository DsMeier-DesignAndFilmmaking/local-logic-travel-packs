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
  }, []);

  const handleDesktopExport = async () => {
    setStatus('syncing');
    
    // 1. DATA EXTRACTION (Crucial Step)
    // We explicitly map the data so the offline file isn't empty.
    const tier1Data = (pack.tiers as any)?.tier1;
    const sections = tier1Data?.sections || [];

    const cityData = {
      city: pack.city,
      country: pack.country,
      sections: sections
    };

    // 2. THE OFFLINE APP TEMPLATE
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pack.city} | Tactical Vault</title>
    <style>
        :root { --bg: #020617; --card: rgba(30, 41, 59, 0.5); --accent: #10b981; --text: #f8fafc; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; justify-content: center; }
        .app-shell { width: 100%; max-width: 450px; min-height: 100vh; padding: 40px 24px; box-sizing: border-box; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; }
        header { margin-bottom: 40px; }
        .tag { color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 8px; display: block; }
        h1 { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 1; }
        .country { color: #94a3b8; font-size: 18px; font-weight: 600; margin-top: 4px; }
        .card { background: var(--card); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; margin-bottom: 20px; backdrop-filter: blur(10px); }
        .card-title { color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .card-title::before { content: ""; width: 2px; height: 12px; background: var(--accent); border-radius: 2px; }
        .card-content { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
        footer { position: fixed; bottom: 20px; width: 100%; max-width: 402px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.8); padding: 12px; border-radius: 16px; text-align: center; font-size: 10px; color: #475569; font-weight: 800; letter-spacing: 0.1em; border: 1px solid rgba(255,255,255,0.05); }
    </style>
</head>
<body>
    <div class="app-shell">
        <header>
            <span class="tag">Offline Tactical Asset</span>
            <h1>${pack.city.toUpperCase()}</h1>
            <div class="country">${pack.country}</div>
        </header>
        <div id="content"></div>
        <footer>VERIFIED DEPLOYMENT: ${new Date().toLocaleDateString()}</footer>
    </div>

    <script>
        // DATA INJECTION
        const appData = ${JSON.stringify(cityData)};
        const container = document.getElementById('content');

        if (appData.sections && appData.sections.length > 0) {
            appData.sections.forEach(section => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = \`
                    <div class="card-title">\${section.title}</div>
                    <div class="card-content">\${section.content}</div>
                \`;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<div class="card">No data found in vault.</div>';
        }
    </script>
</body>
</html>`;

    // 3. FILE SAVING
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.city}_Vault.html`;
    link.click();
    
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

  const handleMainAction = () => {
    if (isMobile) {
      if (status === 'saved') {
        window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        handleMobileSync();
      }
    } else {
      handleDesktopExport();
    }
  };

  return (
    <>
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className="w-full px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 bg-white text-slate-900 border border-slate-200"
      >
        {status === 'syncing' ? 'Encrypting...' : status === 'saved' ? 'Open Offline Pack' : 'Download for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-white text-slate-900 rounded-[40px] p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black mb-2">Vault Exported</h2>
            <p className="text-slate-600 mb-8">Your interactive tactical guide is now saved to your device.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">Return</button>
          </div>
        </div>
      )}
    </>
  );
}