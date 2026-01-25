// app/sources/page.tsx
import LegalContent from '@/components/LegalContent';

export default function DataSources() {
  return (
    <LegalContent title="Data Sources & Methodology">
      <section className="space-y-8">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Version 1.2 | Signal-Free Intelligence
        </p>

        <div>
          <h2 className="text-2xl font-bold">The Triangulation Method</h2>
          <p>
            Local Logic Travel Packs are not static guidebooks. They are synthesized intelligence products built through a three-layer verification process to ensure reliability in offline environments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">1. Primary Human Intel</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Core "Tactical Logic" is sourced from vetted, frequent travelers and local residents. We prioritize "Ground Truth"—the unwritten rules of a city that automated scrapers often miss, such as specific local scams or optimal transit workarounds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2">2. Algorithmic Synthesis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To ensure scale, we utilize Large Language Models (LLMs) to parse and summarize vast amounts of public documentation, transit schedules, and municipal safety reports. This data is then filtered through our "Problem-First" framework to remove tourist fluff.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2">3. Open-Source Intelligence (OSINT)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We leverage open data from the OpenStreetMap (OSM) foundation and community-driven safety forums. This ensures that our offline search results for hospitals, pharmacies, and police stations remain high-fidelity.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Update Cadence</h2>
          <p>
            Travel Packs are dynamic. When you "Download for Offline Use," you are pulling the most recent version of our synthesized data. We recommend refreshing your packs every 30 days to account for seasonal changes and local infrastructure updates.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Transparency Statement</h2>
          <p>
            Local Logic is an independent project. We do not accept payment from restaurants, hotels, or venues for placement in our packs. Our logic is opinionated and prioritized based on user utility, not commercial partnerships.
          </p>
        </div>
      </section>
    </LegalContent>
  );
}