import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// src/app/layout.tsx
import SWRegister from '@/app/page'; // Adjust path as needed

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local Logic Travel Packs | Offline Travel Guides",
  description: "Curated, opinionated travel guides designed for offline use. Get essential information without tourist traps.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // or "black-translucent" if you want the app content to flow under the status bar
    title: "Travel Packs",
  },
  icons: {
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,      // Prevents UI "jitter" on mobile
  userScalable: false,  // Forces the "Native App" feel
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Register Service Worker globally */}
        <SWRegister /> 
        {children}
      </body>
    </html>
  );
}