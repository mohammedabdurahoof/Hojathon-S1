import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function StudentLearningPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Personalized Learning Plan</h1>
          <p className="text-sm text-slate-400">Step-by-step remedial learning modules generated based on prerequisite analysis.</p>
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="p-4 border border-emerald-500/30 bg-emerald-950/10 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400">Step 1 • Mastered</span>
              <h4 className="text-sm font-bold text-white">Addition (MATH-ADD-01)</h4>
            </div>
            <span className="text-xs font-semibold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full">100% Score</span>
          </div>

          <div className="p-4 border border-indigo-500 bg-indigo-950/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-400">Step 2 • Active Remediation Target</span>
              <h4 className="text-sm font-bold text-white">Division (MATH-DIV-01)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Identified knowledge gap requirement prior to starting Fractions.</p>
            </div>
            <button className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">
              Resume Module
            </button>
          </div>

          <div className="p-4 border border-slate-800 bg-slate-900/30 rounded-xl flex items-center justify-between opacity-60">
            <div>
              <span className="text-xs font-semibold text-slate-500">Step 3 • Locked (Requires Division)</span>
              <h4 className="text-sm font-bold text-slate-300">Fractions (MATH-FRAC-01)</h4>
            </div>
            <span className="text-xs text-slate-500">Locked</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
