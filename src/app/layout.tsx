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