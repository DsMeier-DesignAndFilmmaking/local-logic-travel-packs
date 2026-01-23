'use client';

import { TravelPack } from '@/lib/travelPacks';
import { storePackLocally } from '@/lib/offlineStorage';

interface Tier1DownloadProps {
  pack: TravelPack;
}

/**
 * Download button for Tier 1 content only
 * Downloads and stores only Tier 1 data for offline use
 */
export default function Tier1Download({ pack }: Tier1DownloadProps) {
  const handleDownload = () => {
    if (!pack.tiers?.tier1) {
      return;
    }

    // Create download object with only Tier 1 content
    const tier1Data = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: {
        tier1: pack.tiers.tier1,
      },
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(tier1Data, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    const citySlug = pack.city.toLowerCase().replace(/\s+/g, '-');
    link.download = `travel-pack-tier1-${citySlug}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Store Tier 1 in localStorage for offline access
    // Create a minimal pack with only Tier 1 for storage
    const tier1Pack: TravelPack = {
      city: pack.city,
      country: pack.country,
      tiers: {
        tier1: pack.tiers.tier1,
      },
    };
    storePackLocally(tier1Pack);
  };

  if (!pack.tiers?.tier1) {
    return null;
  }

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium flex items-center gap-2 text-sm"
      style={{ 
        minHeight: '36px', 
        backgroundColor: 'rgba(255, 255, 255, 0.15)', 
        color: 'var(--text-on-dark)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download for Offline Use
    </button>
  );
}
