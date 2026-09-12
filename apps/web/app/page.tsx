import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <span>✨ AI-Powered Educational Acceleration</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          AI Remedial Learning Platform
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-light mb-10 leading-relaxed">
          Personalized learning that helps every student catch up and move forward.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <span>Explore Dashboard</span>
            <span>→</span>
          </Link>
          <Link
            href="/student"
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700 flex items-center justify-center"
          >
            Student Portal
          </Link>
        </div>

        {/* Workflow Overview Diagram */}
        <div className="mt-16 w-full p-6 border border-slate-800 rounded-2xl bg-slate-900/50 text-left">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Remedial Learning Workflow Architecture
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-2 text-center text-xs">
            {['Student', 'Diagnostic', 'Knowledge Gap', 'Prerequisites', 'Learning Plan', 'AI Tutor', 'Practice', 'Assessment', 'Mastery Update'].map((step, idx) => (
              <div key={idx} className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50 text-slate-300 font-medium flex items-center justify-center">
                {step}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 AI Remedial Learning Platform. Phase 1 Architecture Foundation.
      </footer>
    </div>
  );
}
