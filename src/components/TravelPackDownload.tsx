'use client';

import { useState } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const handleDesktopDownload = async () => {
    setStatus('syncing');

    // 1. Prepare the exact data structure used in your UI
    const cityData = JSON.stringify(pack);

    // 2. The Standalone App Shell
    // We add a mobile-shell simulator so it doesn't "stretch" on desktop
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pack.city} | Tactical Offline Vault</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: white; margin: 0; }
        .app-shell { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #0f172a; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); }
        .glass-card { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border-radius: 28px; }
        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
        ::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <div class="app-shell pb-24 relative">
        <header class="p-8 pt-12">
            <div class="flex items-center gap-3 mb-6">
                <div class="status-dot animate-pulse"></div>
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80">Local Tactical Mode</span>
            </div>
            <h1 class="text-5xl font-black tracking-tighter mb-1">${pack.city.toUpperCase()}</h1>
            <p class="text-slate-400 font-medium text-lg">${pack.country}</p>
        </header>

        <main id="app-content" class="px-6 space-y-6">
            </main>

        <nav class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
            <div class="glass-card py-4 px-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Vault Asset</span>
                <span class="text-emerald-500 font-bold">Verified Offline</span>
            </div>
        </nav>
    </div>

    <script>
        const data = ${cityData};
        const container = document.getElementById('app-content');

        function renderUI() {
            if (!data.tiers || !data.tiers.tier1) return;
            
            data.tiers.tier1.sections.forEach(section => {
                const card = document.createElement('div');
                card.className = 'glass-card p-7 transition-all active:scale-[0.98]';
                card.innerHTML = \`
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h2 class="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em]">\${section.title}</h2>
                    </div>
                    <p class="text-slate-200 text-sm leading-relaxed font-medium">\${section.content}</p>
                \`;
                container.appendChild(card);
            });
        }

        renderUI();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${pack.city.replace(/\s+/g, '_')}_Offline_Vault.html`;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Tactical App', accept: { 'text/html': ['.html'] } }],
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

  // ... (Keep existing UI button return logic from previous snippet)
}