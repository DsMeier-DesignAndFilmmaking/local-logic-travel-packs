import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { normalizeCityName } from '@/lib/cities';
import { getTravelPackForCity } from '@/lib/travelPacks';
import OfflineDownload from '@/components/OfflineDownload';
import VaultDebugger from '@/components/debug/VaultDebugger';
import TacticalIntelligence from '@/components/TacticalIntelligence';

interface PageProps {
  params: Promise<{ city: string }>;
}

/**
 * GENERATE METADATA
 * Ensures iOS recognizes the city-specific sandbox manifest.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const citySlug = normalizeCityName(city);
  const pack = getTravelPackForCity(citySlug);

  if (!pack) return { title: 'Pack Not Found' };

  return {
    title: `${pack.city} | Tactical Vault`,
    description: `Offline intelligence for ${pack.city}`,
    manifest: `/api/manifest/${citySlug}`,
    appleWebApp: {
      capable: true,
      title: pack.city,
      statusBarStyle: 'black-translucent',
    },
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
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <header className="pt-8">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white leading-none flex items-center gap-3">
            <span>{pack.city}</span>
            {pack.offlineReady && (
              <span className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                VAULT_OFFLINE_READY
              </span>
            )}
          </h1>
          <div className="flex gap-2 items-center mt-3">
            <span className="h-[1px] w-10 bg-emerald-500/50" />
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">
              Tactical_Vault_V2.2 // {citySlug.replace(/-/g, '_')}
            </p>
          </div>
        </header>

        {/* SYNC & HARDENING UI (Step 1 Logic) */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <OfflineDownload pack={pack} />
          </div>
        </section>

        {/* INTERACTIVE DATA TIERS (Step 2 UI) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Intelligence_Tiers
            </h3>
            <span className="text-[10px] font-mono text-emerald-500/50">SECURE_ACCESS</span>
          </div>
          
          <TacticalIntelligence pack={pack} />
        </section>

        {/* EMERGENCY OFFLINE NOTICE */}
        <footer className="pt-8 border-t border-slate-900">
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
              NOTICE: All data in this vault is cryptographically secured to this device. 
              External network connection is not required for secured assets.
            </p>
          </div>
        </footer>

        {/* DEBUGGER - REMOVED IN PRODUCTION */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
            <VaultDebugger city={pack.city} />
          </div>
        )}
      </div>
    </main>
  );
}