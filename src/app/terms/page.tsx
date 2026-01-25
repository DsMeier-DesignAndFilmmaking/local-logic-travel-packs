// app/terms/page.tsx
import LegalContent from '@/components/LegalContent';

export default function TermsOfService() {
  return (
    <LegalContent title="Terms of Service">
      <section className="space-y-8">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Last Updated: January 24, 2026
        </p>

        <div>
          <h2 className="text-2xl font-bold">1. Nature of Service</h2>
          <p>
            Local Logic Travel Packs (the "Service") provides opinionated, tactical information designed for offline travel support. This information is intended for educational and decision-support purposes only. By using this Service, you acknowledge that travel involves inherent risks.
          </p>
        </div>

        <div className="p-6 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl">
          <h2 className="text-xl font-bold mb-2">2. Tactical Liability Disclaimer</h2>
          <p className="text-sm leading-relaxed italic">
            <strong>The Service is provided "as-is" without warranties of any kind.</strong> Travel conditions, local laws, and safety environments change rapidly. Local Logic does not guarantee the accuracy of any "Action Step" or "Tactical Guide." You are solely responsible for your own safety and for verifying information with official local authorities, embassies, or emergency services.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">3. No Emergency Substitution</h2>
          <p>
            This application is <strong>not</strong> an emergency response tool. In the event of a medical emergency, crime, or natural disaster, you must contact local emergency services immediately. Reliance on offline data during a life-threatening event is at your own risk.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">4. Prohibited Use</h2>
          <p>
            You agree not to use the Service for any illegal activities or to navigate into restricted or dangerous zones intentionally. The Service is meant to help you <em>exit</em> friction, not create it.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
          <p>
            The "Tactical Logic," custom city guides, and "Spontaneity Engine" logic are the intellectual property of Dan Meier. Reproduction or redistribution of these packs for commercial purposes without express written consent is prohibited.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Dan Meier and Local Logic shall not be liable for any direct, indirect, or incidental damages resulting from your use of, or inability to use, the Service—including but not limited to travel delays, financial loss, or personal injury.
          </p>
        </div>
      </section>
    </LegalContent>
  );
}