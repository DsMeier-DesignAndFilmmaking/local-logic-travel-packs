'use client';

import { useState } from 'react';
import { OfflineTravelPack } from '@/types';

export default function OfflineDownload({ pack }: { pack: OfflineTravelPack }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    // EXPERT FIX: Universal Flattener for Cards & MicroSituations
    const flattenData = (data: any) => {
      const tier1 = data?.tiers?.tier1;
      if (!tier1?.cards) return [];

      return tier1.cards.flatMap((card: any) => 
        card.microSituations.map((ms: any) => ({
          title: `${card.headline} > ${ms.title}`,
          content: ms.actions.join('\n• ') + (ms.whatToDoInstead ? `\n\nNote: ${ms.whatToDoInstead}` : '')
        }))
      );
    };

    const payload = {
      city: pack.city,
      sections: flattenData(pack),
      exportedAt: new Date().toLocaleString()
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${payload.city} | Tactical Vault</title>
    <style>
        :root { --bg: #020617; --accent: #10b981; --text: #f8fafc; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 40px 20px; line-height: 1.6; }
        .shell { max-width: 500px; margin: 0 auto; }
        .tag { color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; }
        h1 { font-size: 48px; font-weight: 900; margin: 5px 0; }
        .card { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; margin-bottom: 15px; }
        .card-title { color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; }
        .card-content { font-size: 14px; white-space: pre-wrap; color: #cbd5e1; }
    </style>
</head>
<body>
    <div class="shell">
        <span class="tag">Offline Access Granted</span>
        <h1>${payload.city.toUpperCase()}</h1>
        <div id="root"></div>
    </div>
    <script>
        const data = ${JSON.stringify(payload)};
        const root = document.getElementById('root');
        if (data.sections.length === 0) {
            root.innerHTML = '<div class="card">No data found in vault hierarchy.</div>';
        } else {
            data.sections.forEach(s => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = '<div class="card-title">'+s.title+'</div><div class="card-content">'+s.content+'</div>';
                root.appendChild(div);
            });
        }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.city}_Vault.html`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <button onClick={handleExport} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">
      {isExporting ? 'ENCRYPTING...' : 'DOWNLOAD DESKTOP VAULT'}
    </button>
  );
}