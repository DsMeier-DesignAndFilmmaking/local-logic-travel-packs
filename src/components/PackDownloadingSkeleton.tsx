'use client';

/**
 * Offline-safe loading skeleton for "Pack downloading" state.
 * Pure CSS animation; no API. Swap in when isLoading for pack fetch.
 */

export default function PackDownloadingSkeleton() {
  return (
    <div className="mt-6 space-y-6 animate-fadeIn" role="status" aria-label="Loading travel pack">
      <div
        className="rounded-lg shadow-md p-4 sm:p-6"
        style={{ backgroundColor: '#1e3a8a', border: '1px solid #1e40af' }}
      >
        <div className="mb-6">
          <div className="skeleton-header mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <div className="skeleton-line max-w-[50%]" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Downloading…
      </p>
    </div>
  );
}
