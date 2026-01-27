'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * BackButton Component
 * 
 * Navigates back to home page using router.replace to bypass all navigation guards.
 * This ensures reliable navigation to / without being intercepted by city pack guards
 * or creating history loops in standalone mode.
 */
export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.replace('/')}
      className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
    >
      ← Back to Home
    </button>
  );
}
