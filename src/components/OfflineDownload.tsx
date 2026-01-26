'use client';

import { useState } from 'react';
import { TravelPack } from '@/lib/travelPacks';

interface OfflineDownloadProps {
  pack: TravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    // Extracting the Tier 1 tactical data
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];
    
    const payload = {
      city: pack.city,
      country: pack.country,
      cards: cards,
      exportedAt: new Date().toLocaleString()
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OFFLINE VAULT: ${payload.city}</title>
    <style>
        :root { --bg: #020617; --card: #0f172a; --accent: #10b981; --text: #f8fafc; --border: #1e293b; }
        body { font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { border-bottom: 2px solid var(--accent); padding-bottom: 20px; margin-bottom: 30px; }
        .city { font-size: 3rem; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; margin: 0; }
        .badge { background: var(--accent); color: var(--bg); font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .headline { color: var(--accent); font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; }
        .situation { font-size: 18px; font-weight: 700; margin-bottom: 12px; display: block; }
        .action { font-size: 14px; margin: 8px 0; color: #cbd5e1; display: flex; gap: 10px; }
        .action::before { content: "→"; color: var(--accent); font-weight: bold; }
        .footer { font-size: 10px; color: #475569; margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">Standalone Tactical Export</span>
            <h1 class="city">${payload.city}</h1>
            <p style="color: #64748b; font-weight: 600; font-size: 12px;">Country: ${payload.country} | Generated: ${payload.exportedAt}</p>
        </div>
        <div id="vault-root"></div>
        <div class="footer">Verified Offline Asset • Local Logic Vault</div>
    </div>
    <script>
        const data = ${JSON.stringify(payload)};
        const root = document.getElementById('vault-root');
        data.cards.forEach(card => {
            card.microSituations.forEach(ms => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = \`
                    <div class="headline">\${card.headline}</div>
                    <span class="situation">\${ms.title}</span>
                    \${ms.actions.map(a => '<div class="action">' + a + '</div>').join('')}
                \`;
                root.appendChild(div);
            });
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TACTICAL_VAULT_${pack.city.toUpperCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
      <div className="mb-4">
        <h4 className="text-white text-xs font-black uppercase tracking-widest">Emergency Backup</h4>
        <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
          Generate a single, portable HTML file that contains your tactical data. Use this as a fallback for devices without browser storage support.
        </p>
      </div>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {isExporting ? (
            <>
                <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                PREPARING FILE...
            </>
        ) : 'EXPORT STANDALONE HTML'}
      </button>
    </div>
  );
}