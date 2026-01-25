'use client';

import { useState, useEffect } from 'react';
import { TravelPack } from '@/lib/travelPacks';
import { savePack, getPack } from '../../scripts/offlineDB';
// Fixed: Using the standard alias path for your hook
import { usePWAInstall } from '../../.next/hooks/usePWAInstall'; 

interface Tier1DownloadProps {
  pack: TravelPack;
}

/**
 * Top-bar Download button
 * Updated with Device Detection, PWA Install Trigger, and Success Modal
 */
export default function Tier1Download({ pack }: Tier1DownloadProps) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize the PWA install logic
  const { triggerInstall, canInstall } = usePWAInstall();

  useEffect(() => {
    // Detect device for the modal message
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    async function checkExisting() {
      try {
        const existing = await getPack(pack.city);
        if (existing) setStatus('saved');
      } catch (err) {
        console.error('Error checking IndexedDB:', err);
      }
    }
    checkExisting();
  }, [pack.city]);

  const handleSync = async () => {
    if (!pack.tiers?.tier1 || status !== 'idle') return;

    setStatus('syncing');

    const downloadData = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: {
        tier1: pack.tiers.tier1,
      },
    };

    try {
      // 1. Save data to IndexedDB
      await savePack(downloadData);
      
      // 2. Artificial delay for UX "weight"
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 3. Trigger Native Install Prompt
      if (canInstall) {
        await triggerInstall();
      }

      setStatus('saved');
      setShowSuccessModal(true); 
      
    } catch (err) {
      console.error('Failed to sync:', err);
      setStatus('idle');
    }
  };

  if (!pack.tiers?.tier1) return null;

  const config = {
    idle: {
      text: "Download for Offline Use",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "rgba(255, 255, 255, 0.15)",
      textColor: "var(--text-on-dark)"
    },
    syncing: {
      text: "Syncing...",
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      bg: "rgba(255, 255, 255, 0.1)",
      textColor: "rgba(255, 255, 255, 0.7)"
    },
    saved: {
      text: "Available Offline",
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      bg: "rgba(16, 185, 129, 0.2)",
      textColor: "#A7F3D0"
    }
  };

  const current = config[status];

  return (
    <>
      <button
        onClick={handleSync}
        disabled={status !== 'idle'}
        className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium flex items-center gap-2 text-sm"
        style={{ 
          minHeight: '36px', 
          backgroundColor: current.bg, 
          color: current.textColor,
          border: status === 'saved' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.3)',
          cursor: status === 'idle' ? 'pointer' : 'default'
        }}
      >
        {current.icon}
        {current.text}
      </button>

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-3">Local Vault Synced</h2>
            
            <p className="text-slate-600 mb-8 text-sm leading-relaxed">
              {isMobile 
                ? "The Travel Pack icon has been added to your Home Screen for instant offline access." 
                : "The Offline App is now available in your Applications folder or Launchpad."}
            </p>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              Ready for Departure
            </button>
          </div>
        </div>
      )}
    </>
  );
}