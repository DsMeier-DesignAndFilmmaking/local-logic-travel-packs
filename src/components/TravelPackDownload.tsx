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

    // 1. DATA DRILLER: Extracting from your specific Bangkok JSON structure
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];

    // Flattening Nested Micro-Situations into a format the HTML can read
    const flatSections = cards.flatMap((card: any) => 
      (card.microSituations || []).map((ms: any) => ({
        title: `${card.headline} > ${ms.title}`,
        content: `**ACTIONS:**\n${ms.actions.map((a: string) => `• ${a}`).join('\n')}\n\n**PRO TIP:**\n${ms.whatToDoInstead || 'No additional notes.'}`
      }))
    );

    const cityData = {
      city: pack.city,
      country: pack.country,
      sections: flatSections,
      timestamp: new Date().toLocaleString()
    };

    // 2. UPDATED INJECTION LOGIC
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cityData.city} | Tactical Vault</title>
    <style>
        :root { --bg: #020617; --card: #0f172a; --accent: #10b981; --text: #f8fafc; --muted: #64748b; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; justify-content: center; }
        .shell { width: 100%; max-width: 480px; min-height: 100vh; padding: 40px 20px; box-sizing: border-box; }
        .card { background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .card-title { color: var(--accent); font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
        .card-content { font-size: 15px; color: #cbd5e1; white-space: pre-wrap; line-height: 1.6; }
        h1 { font-size: 42px; font-weight: 900; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="shell">
        <h1>${cityData.city.toUpperCase()}</h1>
        <div id="root"></div>
    </div>
    <script>
        (function() {
            const data = ${JSON.stringify(cityData)};
            const root = document.getElementById('root');
            if (!data.sections || data.sections.length === 0) {
                root.innerHTML = '<div class="card">DATA ERROR: Could not drill into JSON tiers.</div>';
                return;
            }
            data.sections.forEach(s => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = '<div class="card-title">'+s.title+'</div><div class="card-content">'+s.content+'</div>';
                root.appendChild(div);
            });
        })();
    </script>
</body>
</html>`;

    // ... link click logic remains the same ...

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