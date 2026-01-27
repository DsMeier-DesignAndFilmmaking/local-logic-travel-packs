'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 pt-8 pb-6 border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
          <Link 
            href="/privacy" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Privacy
          </Link>
          <Link 
            href="/sources" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Sources
          </Link>
          <Link 
            href="/support" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Support
          </Link>
          <Link 
            href="/terms" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Terms
          </Link>
        </nav>
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Local Logic Travel Packs
        </p>
      </div>
    </footer>
  );
}
