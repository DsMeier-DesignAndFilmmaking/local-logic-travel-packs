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

    // 1. Prepare the Data Payload
    const cityData = JSON.stringify(pack);

    // 2. Create the "Standalone App Shell" 
    // This template includes a basic version of your UI/Tailwind so it looks identical
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OFFLINE: ${pack.city} Tactical Pack</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #f8fafc; font-family: system-ui, sans-serif; }
        .vault-card { border-radius: 24px; background: white; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    </style>
</head>
<body class="p-6">
    <div class="max-w-md mx-auto">
        <header class="mb-8">
            <div class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Offline Vault</div>
            <h1 class="text-4xl font-black text-slate-900">${pack.city}</h1>
            <p class="text-slate-500">${pack.country} • Tactical Guide</p>
        </header>

        <div id="content" class="space-y-6">
            </div>
    </div>

    <script>
        const pack = ${cityData};
        const contentDiv = document.getElementById('content');
        
        // This simulates your app's UI logic offline
        pack.tiers.tier1.sections.forEach(section => {
            const el = document.createElement('div');
            el.className = 'vault-card p-6 border border-slate-100 shadow-sm mb-4';
            el.innerHTML = \`
                <h3 class="font-bold text-slate-900 mb-2 uppercase text-xs tracking-wider text-blue-600">\${section.title}</h3>
                <p class="text-slate-700 leading-relaxed text-sm">\${section.content}</p>
            \`;
            contentDiv.appendChild(el);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${pack.city.replace(/\s+/g, '_')}_Offline_App.html`;

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
            'bg-slate-900 text-white hover:bg-slate-800'}`}
      >
        {status === 'syncing' ? (
          <>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Syncing Vault...
          </>
        ) : status === 'success' ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            App File Saved
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