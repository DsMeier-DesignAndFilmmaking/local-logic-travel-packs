'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/types/travel';
import { savePack, getPack } from '../../scripts/offlineDB';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface OfflineDownloadProps {
  pack: TravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { isStandalone } = usePWAInstall();

  useEffect(() => {
    async function checkSaved() {
      if (!pack?.city) return;
      try {
        const existing = await getPack(pack.city);
        if (existing) {
          setIsSaved(true);
          setIsVerified(true);
        }
      } catch (err) {
        console.error('DB Check Error:', err);
      }
    }
    checkSaved();
  }, [pack?.city]);

  const handleSaveToVault = async () => {
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const packToSave: TravelPack = {
        ...pack,
        downloadedAt: timestamp,
        offlineReady: true,
      };

      await savePack(packToSave);

      window.dispatchEvent(new CustomEvent('vault-sync-complete', {
        detail: { city: pack.city, timestamp }
      }));

      setIsSaved(true);
      setIsVerified(true);
    } catch (err) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (!isStandalone && !isOffline) {
        alert('Failed to save pack. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];
    
    const payload = {
      city: pack.city,
      country: pack.country,
      cards: cards,
      exportedAt: new Date().toLocaleString()
    };

    // ADA Compliant Export Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OFFLINE VAULT: ${payload.city}</title>
    <style>
        :root { 
          --bg: #020617; 
          --card: #0f172a; 
          --accent: #10b981; /* High contrast emerald */
          --text: #f8fafc; 
          --text-muted: #cbd5e1; /* Increased contrast for muted text */
          --border: #334155; 
        }
        body { 
          font-family: ui-sans-serif, system-ui, sans-serif; 
          background: var(--bg); 
          color: var(--text); 
          line-height: 1.6; 
          padding: 24px; 
          font-size: 16px; /* ADA Standard */
        }
        .container { max-width: 600px; margin: 0 auto; }
        .header { border-bottom: 3px solid var(--accent); padding-bottom: 20px; margin-bottom: 30px; }
        .city { font-size: 2.5rem; font-weight: 800; text-transform: uppercase; margin: 0; line-height: 1.1; }
        .badge { background: var(--accent); color: #020617; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-bottom: 12px; text-transform: uppercase; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
        .headline { color: var(--accent); font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; }
        .situation { font-size: 20px; font-weight: 700; margin-bottom: 16px; display: block; color: var(--text); }
        .action { font-size: 16px; margin: 12px 0; color: var(--text-muted); display: flex; gap: 12px; align-items: flex-start; }
        .action::before { content: "▶"; color: var(--accent); font-size: 12px; padding-top: 4px; }
        .footer { font-size: 14px; color: #94a3b8; margin-top: 60px; text-align: center; border-top: 1px solid var(--border); padding-top: 20px; }
    </style>
</head>
<body>
    <main class="container">
        <header class="header">
            <span class="badge">Tactical Export</span>
            <h1 class="city">${payload.city}</h1>
            <p style="color: var(--text-muted); font-weight: 600;">Location: ${payload.country} | Generated: ${payload.exportedAt}</p>
        </header>
        <div id="vault-root"></div>
        <footer class="footer">Verified Offline Asset &bull; Tactical Vault</footer>
    </main>
    <script>
        const data = ${JSON.stringify(payload)};
        const root = document.getElementById('vault-root');
        data.cards.forEach(card => {
            card.microSituations.forEach(ms => {
                const div = document.createElement('article');
                div.className = 'card';
                div.innerHTML = \`
                    <div class="headline">\${card.headline}</div>
                    <h2 class="situation">\${ms.title}</h2>
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
    <div className="space-y-6">
      {/* Main Download Button Section */}
      <section 
        className="p-5 sm:p-8 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl"
        aria-labelledby="vault-heading"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h4 id="vault-heading" className="text-white text-sm sm:text-base font-black uppercase tracking-wider">
              Offline Vault
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-2">
              Secure all travel tiers to local storage for use without cellular data.
            </p>
          </div>
          {isVerified && (
            <div 
              role="status"
              aria-label="Pack is verified and saved"
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/60 rounded-full flex-shrink-0"
            >
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Verified
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSaveToVault}
          disabled={isSaving || isSaved}
          aria-busy={isSaving}
          className="w-full py-4 min-h-[48px] bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-emerald-500 outline-none flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span>Syncing to Vault...</span>
            </>
          ) : isSaved ? (
            <>
              <span aria-hidden="true">✓</span>
              <span>Vault Secured</span>
            </>
          ) : (
            'Download Tactical Pack'
          )}
        </button>
      </section>

    </div>
  );
}