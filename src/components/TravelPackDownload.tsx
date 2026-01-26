'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const handleDesktopDownload = async () => {
    setStatus('syncing');

    // 1. Prepare the Full Data Payload
    const cityData = JSON.stringify(pack);

    // 2. Create the "Standalone App Shell" 
    // This uses a mobile-first container and the exact visual language of your live app
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pack.city} | Tactical Offline Pack</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: white; margin: 0; }
        .app-shell { max-width: 450px; margin: 0 auto; min-height: 100vh; background: #0f172a; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); }
        .glass-card { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border-radius: 28px; }
        ::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <div class="app-shell pb-24">
        <header class="p-8 pt-12">
            <div class="flex items-center gap-2 mb-6">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80">Offline Tactical Vault</span>
            </div>
            <h1 class="text-5xl font-black tracking-tighter mb-2 leading-none">${pack.city.toUpperCase()}</h1>
            <p class="text-slate-400 font-medium text-lg">${pack.country}</p>
        </header>

        <main id="offline-main" class="px-6 space-y-6">
            </main>

        <footer class="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
            <div class="glass-card py-4 px-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Standalone Access</span>
                <span class="text-emerald-500 font-bold">Verified Offline</span>
            </div>
        </footer>
    </div>

    <script>
        const pack = ${cityData};
        const main = document.getElementById('offline-main');

        function renderPack() {
            // Render Tier 1 as primary offline data
            if (pack.tiers && pack.tiers.tier1) {
                pack.tiers.tier1.sections.forEach(section => {
                    const el = document.createElement('div');
                    el.className = 'glass-card p-7 transition-all';
                    el.innerHTML = \`
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <h2 class="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em]">\${section.title}</h2>
                        </div>
                        <p class="text-slate-200 text-sm leading-relaxed">\${section.content}</p>
                    \`;
                    main.appendChild(el);
                });
            }
        }

        renderPack();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${pack.city.replace(/\s+/g, '_')}_Tactical_Pack.html`;

    try {
      // 3. Trigger Native File System "Save As"
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Offline Tactical App', accept: { 'text/html': ['.html'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error("Export failed", err);
      setStatus('idle');
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleDesktopDownload}
        disabled={status === 'syncing'}
        className={`w-full px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] 
          ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
            status === 'syncing' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
            'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20'}`}
      >
        {status === 'syncing' ? (
          <>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Generating App File...
          </>
        ) : status === 'success' ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Asset Locked & Saved
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download for Offline Use
          </>
        )}
      </button>
    </div>
  );
}