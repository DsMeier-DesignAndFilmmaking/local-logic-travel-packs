'use client';

import { useState, useEffect } from 'react';
import { normalizeCityName } from '@/lib/cities';

interface VaultDebuggerProps {
  city: string;
}

export default function VaultDebugger({ city }: VaultDebuggerProps) {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cachedFiles, setCachedFiles] = useState<string[]>([]);
  const [swStatus, setSwStatus] = useState<string>('checking...');
  const [isVisible, setIsVisible] = useState(false);

  const citySlug = normalizeCityName(city);
  const CACHE_VERSION = 'v2.2';
  const targetCache = `city-pack-${citySlug}-${CACHE_VERSION}`;

  const refreshDebugData = async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    // 1. Check SW Status
    if (navigator.serviceWorker.controller) {
      setSwStatus(`Active (${navigator.serviceWorker.controller.state})`);
    } else {
      setSwStatus('No Controller');
    }

    // 2. Inspect Specific Cache
    try {
      const cache = await caches.open(targetCache);
      const keys = await cache.keys();
      setCachedFiles(keys.map(k => new URL(k.url).pathname));
      setCacheSize(keys.length);
    } catch (e) {
      setCacheSize(0);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshDebugData, 2000);
    return () => clearInterval(interval);
  }, [citySlug]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-slate-800 text-[8px] text-slate-500 p-2 rounded-full border border-slate-700 opacity-50 z-[9999]"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-4 bg-black/90 border border-emerald-500/50 rounded-xl p-4 z-[9999] font-mono text-[10px] text-emerald-400 shadow-2xl">
      <div className="flex justify-between items-start mb-2 border-b border-emerald-500/20 pb-2">
        <h5 className="font-black uppercase tracking-widest">Vault Analytics</h5>
        <button onClick={() => setIsVisible(false)} className="text-white">✕</button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">SW_STATUS:</span>
          <span>{swStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">CACHE_TARGET:</span>
          <span>{targetCache}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">OBJECTS_SECURED:</span>
          <span className={cacheSize > 0 ? "text-emerald-400" : "text-amber-500"}>{cacheSize}</span>
        </div>
      </div>

      <div className="mt-3 max-h-32 overflow-y-auto bg-slate-900/50 p-2 rounded border border-slate-800">
        <p className="text-slate-600 mb-1 uppercase text-[8px]">Cache Manifest:</p>
        {cachedFiles.length > 0 ? (
          cachedFiles.map((file, i) => (
            <div key={i} className="truncate border-b border-white/5 last:border-0 py-1">
              ✓ {file}
            </div>
          ))
        ) : (
          <p className="text-red-500 animate-pulse italic">No assets hardened...</p>
        )}
      </div>

      <button 
        onClick={refreshDebugData}
        className="w-full mt-3 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded uppercase font-black"
      >
        Force Scan
      </button>
    </div>
  );
}