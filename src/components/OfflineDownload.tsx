'use client';

import { useState } from 'react';
import { OfflineTravelPack } from '@/types';

interface OfflineDownloadProps {
  pack: OfflineTravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);

    // FIX: Use type casting (as any) to access properties that might 
    // exist on the object but aren't explicitly in the 'OfflineTravelPack' interface
    const rawPack = pack as any;
    
    const cityData = {
      city: rawPack.city || 'Unknown City',
      country: rawPack.country || 'Unknown Region',
      // Safely grab sections from either possible location
      sections: rawPack.tiers?.tier1?.sections || rawPack.sections || [],
      timestamp: new Date().toLocaleString(),
    };

    // 2. THE SELF-RENDERING VAULT ENGINE
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${cityData.city} | Tactical Vault</title>
    <style>
        :root { 
            --bg: #020617; --card: #0f172a; --accent: #10b981; 
            --text: #f8fafc; --muted: #64748b; --border: rgba(255,255,255,0.06);
        }
        body { 
            font-family: -apple-system, system-ui, sans-serif; 
            background: var(--bg); color: var(--text); margin: 0; 
            display: flex; justify-content: center; line-height: 1.6;
        }
        .shell { width: 100%; max-width: 480px; min-height: 100vh; padding: 40px 24px; box-sizing: border-box; border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
        .badge { font-size: 10px; font-weight: 900; color: var(--accent); letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 12px; display: block; }
        h1 { font-size: 52px; font-weight: 900; margin: 0; letter-spacing: -0.04em; line-height: 0.85; }
        .location { font-size: 20px; color: var(--muted); font-weight: 600; margin-top: 8px; margin-bottom: 48px; }
        .card { 
            background: var(--card); border: 1px solid var(--border); border-radius: 28px; 
            padding: 32px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            animation: slideUp 0.5s ease forwards; opacity: 0;
        }
        .card-tag { font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .card-tag::before { content: ""; width: 2px; height: 12px; background: var(--accent); border-radius: 4px; }
        .content { font-size: 16px; color: #cbd5e1; }
        footer { margin-top: 60px; padding: 24px; text-align: center; border-top: 1px solid var(--border); font-size: 9px; color: var(--muted); letter-spacing: 0.1em; font-weight: 800; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="shell">
        <span class="badge">Verified Tactical Asset</span>
        <h1>\${cityData.city.toUpperCase()}</h1>
        <div class="location">\${cityData.country}</div>
        <div id="vault-root"></div>
        <footer>
            REF: \${cityData.city.substring(0, 3).toUpperCase()}-OFL-SECURE | GENERATED: \${cityData.timestamp}
        </footer>
    </div>
    <script>
        (function() {
            const data = \${JSON.stringify(cityData)};
            const root = document.getElementById('vault-root');
            if (!data.sections || data.sections.length === 0) {
                root.innerHTML = '<div class="card" style="opacity:1"><div class="card-tag">System Error</div><div class="content">No encrypted data sections found in vault.</div></div>';
                return;
            }
            data.sections.forEach((s, i) => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style.animationDelay = (i * 0.1) + 's';
                div.innerHTML = \\\`<div class="card-tag">\\\${s.title}</div><div class="content">\\\${s.content}</div>\\\`;
                root.appendChild(div);
            });
        })();
    </script>
</body>
</html>`;

    // 3. TRIGGER DOWNLOAD
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `\${cityData.city.replace(/\\s+/g, '_')}_Tactical_Vault.html`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
        >
          {isExporting ? 'Encrypting Vault...' : 'Export Offline App'}
        </button>
      </div>
      
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-widest block mb-1">Status: Access Granted</span>
            <p className="text-emerald-600/80 dark:text-emerald-400/60 text-sm leading-snug">
              This pack is fully unlocked. The exported file is a standalone interactive app that requires no internet connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}