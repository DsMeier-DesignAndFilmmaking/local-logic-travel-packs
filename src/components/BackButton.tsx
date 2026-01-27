'use client';

export default function BackButton() {
  return (
    <button
      onClick={() => {
        window.location.href = '/';
      }}
      className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
    >
      ← Back to Home
    </button>
  );
}
