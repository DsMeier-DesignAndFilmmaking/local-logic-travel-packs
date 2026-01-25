// app/library/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { getAllSavedPacks } from '@/lib/offlineStorage';

export default function LibraryPage() {
  const [savedPacks, setSavedPacks] = useState<any[]>([]);

  useEffect(() => {
    // Logic to pull all saved keys from local storage
    const packs = JSON.parse(localStorage.getItem('saved_packs') || '[]');
    setSavedPacks(packs);
  }, []);

  return (
    <main className="container mx-auto px-5 py-12 max-w-4xl min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Offline Library</h1>
      
      {savedPacks.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400">No tactical packs stored yet.</p>
          <Link href="/" className="text-blue-600 font-bold mt-2 inline-block">Browse Destinations</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedPacks.map((pack) => (
            <div key={pack.city} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{pack.city}</h3>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Ready for Offline
                </span>
              </div>
              <Link href={`/?city=${pack.city}`} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Open</Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}