// components/LegalContent.tsx
import Link from 'next/link';

export default function LegalContent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-12"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Local Logic
        </Link>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          {title}
        </h1>
        <div className="h-1 w-20 bg-blue-600 mb-12 rounded-full" />

        <article className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-headings:tracking-tight prose-p:text-slate-600 prose-li:text-slate-600">
          {children}
        </article>
      </main>
    </div>
  );
}