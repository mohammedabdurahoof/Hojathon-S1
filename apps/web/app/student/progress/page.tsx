import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function StudentProgressPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Progress</h1>
          <p className="text-sm text-slate-400">Track concept mastery scores and grade progression.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
            <h3 className="text-base font-semibold text-white">Current Grade Level vs Target</h3>
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-amber-400">Grade 6</div>
                <div className="text-xs text-slate-400 mt-1">Assessed Level</div>
              </div>
              <div className="text-2xl text-slate-600">➔</div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-emerald-400">Grade 8</div>
                <div className="text-xs text-slate-400 mt-1">Target Class Level</div>
              </div>
            </div>
          </div>

          <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
            <h3 className="text-base font-semibold text-white">Concept Mastery Levels</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Addition</span>
                  <span className="text-emerald-400 font-semibold">95% (Mastered)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[95%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Division</span>
                  <span className="text-amber-400 font-semibold">45% (In Progress)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[45%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Fractions</span>
                  <span className="text-slate-500">0% (Not Started)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 w-0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
