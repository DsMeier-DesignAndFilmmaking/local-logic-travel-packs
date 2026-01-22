'use client';

import { OfflineTravelPack } from '@/types';

interface OfflineDownloadProps {
  pack: OfflineTravelPack;
}

export default function OfflineDownload({ pack }: OfflineDownloadProps) {
  const handleDownload = () => {
    // Convert pack to JSON string
    const jsonString = JSON.stringify(pack, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-pack-${pack.city.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show alert
    alert('Travel Pack downloaded!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Download Travel Pack
          </button>
        </div>
      </div>
      
      {/* Monetization placeholder - informational only, does not block downloads */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600 dark:text-green-400 font-semibold shrink-0">Free</span>
          <p className="text-gray-600 dark:text-gray-400">
            Your first travel pack is free. Premium packs with AI-generated recommendations and exclusive city insights coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
