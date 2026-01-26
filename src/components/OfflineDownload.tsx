'use client';

import { useState } from 'react';
import { OfflineTravelPack } from '@/types';

interface OfflineDownloadProps {
  pack: OfflineTravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDesktopExport = () => {
    setIsExporting(true);

    // 1. RECURSIVE DATA FLATTENING (The Expert "Open in App" Bridge)
    // This replicates the exact logic used to render the "Open in App" view
    const extractSections = (data: any) => {
      // Check all possible nesting locations where your sections might hide
      const sections = data?.tiers?.tier1?.sections || data?.sections || data?.tier1?.sections || [];
      return Array.isArray(sections) ? sections.map(s => ({
        title: s.title || 'Untitled',
        content: s.content || ''
      })) : [];
    };

    const payload = {
      city: (pack as any).city || 'Tactical',
      country: (pack as any).country || 'Vault',
      sections: extractSections(pack),
      exportedAt: new Date().toLocaleString()
    };

    // 2. THE HIGH-FIDELITY APP SHELL (Duplicating your PWA UI)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${payload.city} | Offline Vault</title>
    <style>
        :root { --bg: #020617; --accent: #10b981; --text: #f8fafc; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; justify-content: center; }
        .app-shell { width: 100%; max-width: 450px; min-height: 100vh; padding: 60px 24px; box-sizing: border-box; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; }
        .header { margin-bottom: 40px; }
        .status-tag { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); animation: pulse 2s infinite; }
        .tag-text { font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
        h1 { font-size: 52px; font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 0.85; }
        .subtitle { font-size: 18px; color: #64748b; font-weight: 600; margin-top: 10px; }
        .card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 24px; margin-bottom: 16px; backdrop-filter: blur(12px); opacity: 0; transform: translateY(10px); animation: slideUp 0.5s ease forwards; }
        .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 12px; border-left: 2px solid var(--accent); padding-left: 12px; }
        .card-content { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
        footer { margin-top: 50px; text-align: center; font-size: 9px; color: #475569; font-weight: 700; letter-spacing: 0.1em; border-top: 1px solid #1e293b; padding-top: 20px; }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    </style>
</head>
<body>
    <div class="app-shell">
        <div class="header">
            <div class="status-tag"><div class="dot"></div><span class="tag-text">Tactical Deployment</span></div>
            <h1>${payload.city.toUpperCase()}</h1>
            <div class="subtitle">${payload.country}</div>
        </div>
        <div id="vault-root"></div>
        <footer>SECURE OFFLINE ASSET | GEN: ${payload.exportedAt}</footer>
    </div>
    <script>
        (function() {
            const data = ${JSON.stringify(payload)};
            const root = document.getElementById('vault-root');
            if (!data.sections || data.sections.length === 0) {
                root.innerHTML = '<div class="card"><div class="card-title">System Alert</div><div class="card-content">No data detected in export payload.</div></div>';
                return;
            }
            data.sections.forEach((s, i) => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style.animationDelay = (i * 0.1) + 's';
                div.innerHTML = \`<div class="card-title">\${s.title}</div><div class="card-content">\${s.content}</div>\`;
                root.appendChild(div);
            });
        })();
    </script>
</body>
</html>`;

    // 3. BLOB DOWNLOAD TRIGGER
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.city.replace(/\s+/g, '_')}_Tactical_Vault.html`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="w-full py-4">
      <button
        onClick={handleDesktopExport}
        disabled={isExporting}
        className="w-full px-6 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl border border-white/10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isExporting ? 'Generating App...' : 'Download Desktop Vault'}
      </button>
      
      <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
        Standalone Interactive File for Desktop Use
      </p>
    </div>
  );
}