'use client';

import { useState } from 'react';
import { OfflineTravelPack } from '@/types';

export default function OfflineDownload({ pack }: { pack: OfflineTravelPack }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    // This replicates the exact logic from the main component to ensure 1:1 UI
    const tier1 = (pack as any).tiers?.tier1;
    const cards = tier1?.cards || [];

    const htmlContent = `<!DOCTYPE html>...[PASTE THE TEMPLATE FROM ABOVE]...`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.city}_Standalone_Vault.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  return (
    <button 
      onClick={handleExport}
      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black tracking-tighter"
    >
      {isExporting ? 'PREPARING...' : 'EXPORT STANDALONE HTML'}
    </button>
  );
}