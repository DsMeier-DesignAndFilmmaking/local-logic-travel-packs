import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { normalizeCityName } from '@/lib/cities';
import { getTravelPackForCity } from '@/lib/travelPacks';
import OfflineDownload from '@/components/OfflineDownload'; // Your refactored sync button
import VaultDebugger from '@/components/debug/VaultDebugger';

interface PageProps {
  params: Promise<{ city: string }>;
}

/**
 * GENERATE METADATA
 * This is the critical piece. It tells the mobile browser 
 * WHICH manifest to use for the "Add to Home Screen" action.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const citySlug = normalizeCityName(city);
  const pack = getTravelPackForCity(citySlug);

  if (!pack) return { title: 'Pack Not Found' };

  return {
    title: `${pack.city} | Tactical Vault`,
    description: `Offline intelligence for ${pack.city}`,
    
    // 1. Point to your dynamic API route
    manifest: `/api/manifest/${citySlug}`,
    
    // 2. iOS Specific "Standalone" Tags
    appleWebApp: {
      capable: true,
      title: pack.city,
      statusBarStyle: 'black-translucent',
    },
    
    // 3. Icons (Matches what we put in the manifest)
    icons: {
      apple: `/icons/${citySlug}-192.png`,
    }
  };
}

export default async function CityPackPage({ params }: PageProps) {
  const { city } = await params;
  const citySlug = normalizeCityName(city);
  const pack = getTravelPackForCity(citySlug);

  if (!pack) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      {/* This is the button we refactored. 
          When clicked, it will now "harden" this specific page, 
          its data, and its dynamic manifest.
      */}
      <div className="max-w-md mx-auto pt-12 space-y-8">
        <header>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            {pack.city}
          </h1>
          <p className="text-slate-500 font-mono text-xs">TACTICAL_UNIT_V2.2</p>
        </header>

        <OfflineDownload pack={pack} />

        {/* Your other UI components like Travel Data, Maps, etc. */}
        
        {/* Debug Overlay for Testing on Mobile */}
        {process.env.NODE_ENV === 'development' && (
          <VaultDebugger city={pack.city} />
        )}
      </div>
    </main>
  );
}