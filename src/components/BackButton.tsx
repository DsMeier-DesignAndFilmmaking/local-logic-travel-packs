'use client';

/**
 * BackButton Component
 * 
 * Unbreakable hard navigation to home page.
 * 
 * Features:
 * - Uses window.location.assign() for hard navigation (bypasses router)
 * - Sets localStorage flag to override auto-redirect logic
 * - No dependency on Next.js router or app routing state
 * - Works even if router interception logic exists
 */
export default function BackButton() {
  const handleBackHome = () => {
    // Set localStorage flag to signal explicit user intent to go home
    // This flag will be checked by all auto-redirect logic to skip redirects
    if (typeof window !== 'undefined') {
      localStorage.setItem('allowHome', 'true');
      
      // Use window.location.assign() for hard navigation
      // This bypasses Next.js router completely and cannot be intercepted
      // assign() is preferred over href= for programmatic navigation
      window.location.assign('/');
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
