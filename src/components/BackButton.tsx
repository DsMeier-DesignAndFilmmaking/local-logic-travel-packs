'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * BackButton Component
 * 
 * Navigates back to home page using SPA navigation first,
 * with full page reload as fallback if SPA navigation fails.
 * This ensures proper navigation even when service workers
 * or SPA routing might interfere.
 */
export default function BackButton() {
  const router = useRouter();

  const handleBackHome = () => {
    const currentPath = window.location.pathname;
    
    try {
      // Attempt SPA navigation first
      router.push('/');
      
      // If navigation doesn't occur within 300ms, fallback to full reload
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          console.warn('SPA navigation did not occur, falling back to full reload');
          window.location.href = '/';
        }
      }, 300);
      
    } catch (err) {
      console.error('SPA navigation failed, falling back to full reload', err);
      // Full reload fallback
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleBackHome}
      className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
    >
      ← Back to Home
    </button>
  );
}
