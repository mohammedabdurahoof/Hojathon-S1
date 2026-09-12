import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function StudentAssessmentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostic Assessment</h1>
          <p className="text-sm text-slate-400">Phase 1 placeholder for student diagnostic assessment module.</p>
        </div>

        <div className="p-8 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4 max-w-2xl">
          <div className="text-sm font-semibold text-indigo-400">Available Assessment</div>
          <h3 className="text-xl font-bold text-white">Mathematics Foundations Diagnostic</h3>
          <p className="text-xs text-slate-300">
            Assesses arithmetic, division, and fractions prerequisites to build your personalized remedial learning tree.
          </p>
          <div className="pt-2">
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-md">
              Start Assessment (Placeholder)
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
