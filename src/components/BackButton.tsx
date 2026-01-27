'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * BackButton Component
 * 
 * Navigates back to home page using SPA-safe Next.js router navigation.
 * This ensures proper SPA navigation without triggering service worker
 * scope issues or full page reloads.
 */
export default function BackButton() {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  return (
    <button
      onClick={goHome}
      className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
    >
      ← Back to Home
    </button>
  );
}
