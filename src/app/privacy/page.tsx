// app/privacy/page.tsx
import LegalContent from '@/components/LegalContent';

export default function PrivacyPolicy() {
  return (
    <LegalContent title="Privacy Policy">
      <section className="space-y-8">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Last Updated: January 24, 2026
        </p>

        <div>
          <h2 className="text-2xl font-bold">1. Our Privacy Philosophy</h2>
          <p>
            Local Logic Travel Packs is built on the principle of <strong>Data Localization</strong>. 
            We believe that your travel plans and specific city interactions are your business. 
            Our systems are designed to minimize data collection and maximize your control over your information.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Device-Based Data:</strong> We do not collect your GPS location on our servers. Any location-based features are processed locally on your device.</li>
            <li><strong>Offline Storage:</strong> Travel Packs are stored in your browser’s IndexedDB or Cache Storage. This data remains on your device and is not synced to a cloud account.</li>
            <li><strong>Anonymous Analytics:</strong> We may collect high-level usage data (e.g., total city downloads) to improve our tactical guides, but this contains no personally identifiable information (PII).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">3. Data Security</h2>
          <p>
            Because our packs are designed for <strong>offline use</strong>, the "attack surface" for your data is significantly reduced. 
            We do not maintain a central database of user travel histories.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">4. Contact</h2>
          <p>
            For questions regarding this policy, please reach out via the official portfolio portal linked in the Spontaneity Engine section.
          </p>
        </div>
      </section>
    </LegalContent>
  );
}