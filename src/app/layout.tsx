import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// FIX 1: Import from the dedicated component, NOT page.tsx
import SWRegister from '@/components/SWRegister'; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Tactical Vault',
  description: 'Offline-First Tactical Travel Intelligence',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tactical Vault',
    // Startup images can be added here for a better launch experience
  },
  formatDetection: {
    telephone: false, // Prevents Safari from making numbers blue/clickable in tactical data
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: 'cover', // FIX 2: Essential for iPhone SE notch/home-button handling
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* FIX 3: Clean up redundant head tags. Next.js Metadata handles most of this. 
            We keep the manual apple-touch-icon just to be 100% sure for older iOS versions. */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased bg-white text-slate-900">
        {/* SWRegister here ensures the service worker is active across all possible routes */}
        <SWRegister />
        {children}
      </body>
    </html>
  );
}