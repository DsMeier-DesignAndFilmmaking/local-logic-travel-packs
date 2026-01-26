'use client';

import { useState, useEffect, useRef } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '../hooks/usePWAInstall'; 

interface Tier1DownloadProps {
  pack: TravelPack;
}

export default function Tier1Download({ pack }: Tier1DownloadProps) {
  // --- STATE ---
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { triggerInstall, canInstall } = usePWAInstall();

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    async function checkExisting() {
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        try {
          const existing = await getPack(pack.city);
          if (existing) setStatus('saved');
        } catch (err) {
          console.error('Error checking IndexedDB:', err);
        }
      }
    }
    checkExisting();
  }, [pack.city]);

  // --- DESKTOP STANDALONE EXPORT (HIGH-FIDELITY UI) ---
  const handleDesktopExport = async () => {
    setStatus('syncing');
    
    // SAFE EXTRACTION: Solve the "Property sections does not exist" error
    const tierData = (pack.tiers?.tier1 as any) || {};
    const sections = tierData.sections || [];

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
    <title>${pack.city} | Tactical Offline Vault</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: #020617; 
            color: #f8fafc; 
            margin: 0; 
            overflow-x: hidden; 
        }

        .app-shell { 
            max-width: 450px; 
            margin: 0 auto; 
            min-height: 100vh; 
            background: #020617; 
            border-left: 1px solid rgba(255,255,255,0.05); 
            border-right: 1px solid rgba(255,255,255,0.05); 
            position: relative;
            box-shadow: 0 0 100px rgba(0,0,0,0.5);
        }

        .glass-card { 
            background: rgba(30, 41, 59, 0.4); 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            backdrop-filter: blur(16px); 
            border-radius: 32px; 
        }

        .emerald-glow {
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
        }

        ::-webkit-scrollbar { display: none; }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-up { animation: slideUp 0.6s ease forwards; }
    </style>
</head>
<body>
    <div class="app-shell pb-32">
        <header class="p-8 pt-16">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse emerald-glow shadow-[0_0_8px_#10b981]"></div>
                <span class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/90">Verified Offline Deployment</span>
            </div>
            <h1 class="text-6xl font-black tracking-tighter mb-2 leading-[0.85]">${pack.city.toUpperCase()}</h1>
            <p class="text-slate-400 font-bold text-xl tracking-tight">${pack.country}</p>
        </header>

        <main id="offline-main" class="px-6 space-y-6">
            <div id="loading-state" class="text-slate-500 text-xs tracking-widest uppercase py-10 text-center">Decrypting Vault...</div>
        </main>

        <footer class="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto p-6 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
            <div class="glass-card py-5 px-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div class="flex items-center gap-2">
                    <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span>Ref: ${pack.city.substring(0, 3).toUpperCase()}-OFL</span>
                </div>
                <span class="text-emerald-500 font-bold">Asset Secured</span>
            </div>
        </footer>
    </div>

    <script>
        const data = ${cityData};
        const main = document.getElementById('offline-main');
        const loader = document.getElementById('loading-state');

        function render() {
            if (!data.sections || data.sections.length === 0) {
                loader.innerText = "No Encrypted Data Found";
                return;
            }

            loader.style.display = 'none';

            data.sections.forEach((section, idx) => {
                const el = document.createElement('div');
                el.className = 'glass-card p-8 animate-up opacity-0';
                el.style.animationDelay = (idx * 0.1) + 's';
                el.style.marginBottom = '24px';
                
                el.innerHTML = \`
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                        <h2 class="text-emerald-400 text-[11px] font-black uppercase tracking-[0.25em] font-bold">\${section.title}</h2>
                    </div>
                    <p class="text-slate-200 text-[15px] leading-relaxed font-medium opacity-90">\${section.content}</p>
                \`;
                main.appendChild(el);
            });
        }

        document.addEventListener('DOMContentLoaded', render);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `${pack.city.replace(/\s+/g, '_')}_Tactical_Pack.html`;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Tactical App File', accept: { 'text/html': ['.html'] } }],
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
      
      setStatus('saved');
      setShowSuccessModal(true);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error("Export failed", err);
      setStatus('idle');
    }
  };

  // --- MOBILE SYNC ACTION ---
  const handleMobileSync = async () => {
    setStatus('syncing');
    try {
      await savePack({ ...pack, downloadedAt: new Date().toISOString() });
      await new Promise(r => setTimeout(r, 800));
      if (canInstall) await triggerInstall();
      setStatus('saved');
      setShowSuccessModal(true);
    } catch (err) {
      setStatus('idle');
    }
  };

  // --- MAIN BUTTON HANDLER ---
  const handleMainAction = () => {
    if (status === 'syncing') return;
    if (isMobile) {
      if (status === 'saved') {
        const slug = pack.city.toLowerCase().replace(/\s+/g, '-');
        window.location.href = `/packs/${slug}`;
      } else {
        handleMobileSync();
      }
    } else {
      handleDesktopExport();
    }
  };

  if (!pack.tiers?.tier1) return null;

  const config = {
    idle: {
      text: "Download for Offline Use",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      styles: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 cursor-pointer"
    },
    syncing: {
      text: isMobile ? "Syncing Tactical Logic..." : "Packaging App Experience...",
      icon: <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
      styles: "bg-slate-50 text-blue-600 border border-blue-100 cursor-wait"
    },
    saved: {
      text: isMobile ? "Open Offline Pack" : "Tactical App Saved", 
      icon: <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      styles: "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer shadow-sm"
    }
  };

  const current = config[status];

  return (
    <>
      <button
        onClick={handleMainAction}
        disabled={status === 'syncing'}
        className={`w-full px-6 py-4 rounded-2xl focus:outline-none transition-all font-bold flex items-center justify-center gap-3 active:scale-[0.98] touch-manipulation ${current.styles}`}
      >
        {current.icon}
        {current.text}
      </button>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black mb-2">{isMobile ? 'Sync Complete' : 'Vault Exported'}</h2>
            <p className="text-slate-600 text-sm mb-8 px-2 leading-relaxed">
              {isMobile 
                ? 'Tactical data is now locked in your local vault.' 
                : 'Your interactive standalone app file has been saved. Open it anytime to access your tactical guide offline.'}
            </p>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}