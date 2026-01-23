'use client';

import { TravelPack } from '@/lib/travelPacks';
import { storePackLocally } from '@/lib/offlineStorage';

interface TravelPackDownloadProps {
  pack: TravelPack;
}

export default function TravelPackDownload({ pack }: TravelPackDownloadProps) {
  const handleDownload = () => {
    // Create download object with all tier content
    const downloadData = {
      city: pack.city,
      country: pack.country,
      downloadedAt: new Date().toISOString(),
      tiers: pack.tiers,
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(downloadData, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    const citySlug = pack.city.toLowerCase().replace(/\s+/g, '-');
    link.download = `travel-pack-${citySlug}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Store in localStorage for offline access
    storePackLocally(pack);
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
      style={{ minHeight: '44px', backgroundColor: 'var(--accent-blue)', color: '#FFFFFF' }} // Touch-friendly, ADA contrast
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download for Offline Use
    </button>
  );
}
