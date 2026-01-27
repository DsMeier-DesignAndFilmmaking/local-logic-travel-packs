'use client';

import React from 'react';

interface DownloadRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCity?: string;
}

/**
 * Download Required Modal
 * 
 * Shown when user tries to navigate to another city pack
 * in standalone mode. Explains that they need to download
 * the pack first.
 */
export default function DownloadRequiredModal({ 
  isOpen, 
  onClose, 
  targetCity 
}: DownloadRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📥</span>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Download Required
          </h2>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {targetCity 
              ? `The ${targetCity} pack is not available in this installed app. To access it, you'll need to download it from the main website.`
              : 'This pack is not available in this installed app. To access it, you\'ll need to download it from the main website.'
            }
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Got It
            </button>
            
            <button
              onClick={() => {
                // Open main website in new tab/window
                if (typeof window !== 'undefined') {
                  window.open('/', '_blank');
                }
                onClose();
              }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Open Main Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
