// app/support/page.tsx
'use client';

import { useState } from 'react';
import LegalContent from '@/components/LegalContent';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to send to your backend or email service
    setSubmitted(true);
  };

  return (
    <LegalContent title="Field Support & Logic Reporting">
      <div className="space-y-8">
        {!submitted ? (
          <>
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
              <h2 className="text-xl font-bold text-blue-900 mb-2">Report a Friction Point</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Found a closed pharmacy? Is a local scam evolving? Use this form to report broken logic or suggest tactical improvements. Our intelligence depends on ground-truth data from travelers like you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="alex@travel.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Type of Intel</label>
                <select className="w-full p-4 rounded-xl border border-slate-200 outline-none bg-white">
                  <option>Broken Logic (Inaccurate Info)</option>
                  <option>New Tactical Suggestion</option>
                  <option>Technical Support (App/Offline Issues)</option>
                  <option>General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">The Intelligence</label>
                <textarea 
                  rows={5}
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Describe the situation, city, and what needs to be updated..."
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-all active:scale-[0.98]"
              >
                Transmit Intelligence
              </button>
            </form>
          </>
        ) : (
          <div className="py-20 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Intel Received</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              Thank you for contributing to the collective logic. Our team will verify this data and update the relevant Travel Packs.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              Submit another report
            </button>
          </div>
        )}
      </div>
    </LegalContent>
  );
}