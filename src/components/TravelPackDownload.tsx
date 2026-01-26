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

  // High-Fidelity HTML Generator for Desktop Export
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

  // THE MASTER ACTION HANDLER (Fixed Naming)
  const handleMainAction = async () => {
    if (status === 'syncing') return;

    if (isMobile) {
      if (status === 'saved') {
        window.location.href = `/packs/${pack.city.toLowerCase().replace(/\s+/g, '-')}`;
        return;
      }
      setStatus('syncing');
      try {
        // Critical for iPhone SE: Await the physical DB save
        await savePack({ ...pack, downloadedAt: new Date().toISOString() });
        if (canInstall) await triggerInstall();
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { 
        console.error('Sync error:', err);
        setStatus('idle'); 
      }
    } else {
      // Desktop Export Logic
      setStatus('syncing');
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
            {status === 'saved' ? 'Vault is encrypted & offline-ready' : 'Ready for local deployment'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === 'saved' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
      </div>

      <button
        onClick={handleMainAction} // FIXED: Matched name to function
        disabled={status === 'syncing'}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3
          ${status === 'saved' 
            ? 'bg-white text-emerald-600 border-2 border-emerald-100 shadow-sm' 
            : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
      >
        {status === 'syncing' ? 'Encrypting...' : status === 'saved' ? 'Open Offline Vault' : 'Secure for Offline Use'}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black text-slate-900">Vault Synced</h2>
            <p className="text-slate-500 mt-2 text-sm">
              {isMobile ? "Add this to your Home Screen to use without internet." : "Tactical HTML file generated successfully."}
            </p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-bold">DISMISS</button>
          </div>
        </div>
      )}
    </div>
  );
}