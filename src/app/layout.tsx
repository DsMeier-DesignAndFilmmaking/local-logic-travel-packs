// 1. REMOVE "use client" from the top line
import { Metadata } from "next"; 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister"; // Import the unified component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Metadata belongs in Server Components (keep this here!)
export const metadata: Metadata = {
  title: 'Tactical Vault',
  description: 'Offline-First Tactical Travel Intelligence',
  // ADD THIS SECTION:
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/icons/icon-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  // This tells iOS that your site is a standalone "app"
  appleWebApp: {
    capable: true, // This is the "Auto-Launch" magic for iOS
    statusBarStyle: 'black-translucent', // Makes it look native
    title: 'Tactical Vault',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 3. The Client logic lives inside this component only */}
        <SWRegister /> 
        {children}
      </body>
    </html>
  );
}