'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [iosStep, setIosStep] = useState<1 | 2>(1);
  
  const lastJumpRef = useRef(0);
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
    // 1. Explicitly extract sections to ensure 'data.sections' exists in the HTML
    const tierData = (pack.tiers?.tier1 as any) || {};
    const sections = tierData.sections || [];

    // 2. Format exactly for the offline script
    const cityData = JSON.stringify({
      city: pack.city,
      country: pack.country,
      sections: sections
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pack.city} | Tactical Vault</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        /* Hardcoded Fallback Styles in case CDN fails */
        body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; margin: 0; }
        .app-shell { max-width: 450px; margin: 0 auto; min-height: 100vh; background: #020617; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; position: relative; }
        .glass-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 32px; margin-bottom: 24px; }
        .emerald-glow { box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: slideUp 0.6s ease forwards; opacity: 0; }
    </style>
</head>
<body>
    <div class="app-shell pb-32">
        <header class="p-8 pt-16">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse emerald-glow shadow-[0_0_8px_#10b981]"></div>
                <span class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Offline Deployment</span>
            </div>
            <h1 class="text-6xl font-black tracking-tighter mb-2 leading-[0.85]">${pack.city.toUpperCase()}</h1>
            <p class="text-slate-400 font-bold text-xl">${pack.country}</p>
        </header>

        <main id="offline-main" class="px-6">
            <div id="status-msg" class="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center py-10">Initializing...</div>
        </main>

        <footer class="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto p-6 bg-gradient-to-t from-[#020617] to-transparent">
            <div class="glass-card !py-4 !px-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>REF: ${pack.city.substring(0, 3).toUpperCase()}-OFL</span>
                <span class="text-emerald-500">Asset Secured</span>
            </div>
        </footer>
    </div>

    <script>
        // Use a small delay to ensure Tailwind has processed the DOM
        window.addEventListener('load', () => {
            try {
                const data = ${cityData};
                const main = document.getElementById('offline-main');
                const status = document.getElementById('status-msg');

                if (data.sections && data.sections.length > 0) {
                    status.style.display = 'none';
                    data.sections.forEach((section, idx) => {
                        const el = document.createElement('div');
                        el.className = 'glass-card animate-up';
                        el.style.animationDelay = (idx * 0.1) + 's';
                        el.innerHTML = \`
                            <div class="flex items-center gap-3 mb-5">
                                <div class="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                                <h2 class="text-emerald-400 text-[11px] font-black uppercase tracking-widest">\${section.title}</h2>
                            </div>
                            <p class="text-slate-200 text-[15px] leading-relaxed font-medium opacity-90">\${section.content}</p>
                        \`;
                        main.appendChild(el);
                    });
                } else {
                    status.innerText = "NO DATA SECTIONS FOUND IN THIS PACK";
                }
            } catch (err) {
                document.getElementById('status-msg').innerText = "DECRYPTION ERROR: " + err.message;
            }
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${pack.city.replace(/\s+/g, '_')}_Tactical_Pack.html`;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }] });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = fileName; link.click();
      }
      setStatus('saved');
      setShowSuccessModal(true);
    } catch (err) { console.error('Export failed', err); setStatus('idle'); }
  };

  const handleMainAction = async () => {
    if (status === 'syncing') return;
    if (status === 'saved' && isMobile) {
      window.location.href = `/packs/\${pack.city.toLowerCase().replace(/\\s+/g, '-')}`;
      return;
    }
    setStatus('syncing');
    if (isMobile) {
      try {
        await savePack({ ...pack, downloadedAt: new Date().toISOString() });
        if (canInstall) await triggerInstall();
        setStatus('saved');
        setShowSuccessModal(true);
      } catch (err) { setStatus('idle'); }
    } else {
      await handleDesktopExport();
    }
  };

  // ... (Rest of modal/ios logic same as previous response)
  return (
    <div className="w-full space-y-3">
        <button onClick={handleMainAction} disabled={status === 'syncing'} className="w-full px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] bg-white text-slate-900 border border-slate-200">
            {status === 'syncing' ? "Syncing..." : status === 'saved' ? "Open Offline Pack" : "Download for Offline Use"}
        </button>
        {/* Modals omitted for brevity, logic remains identical */}
    </div>
  );
}