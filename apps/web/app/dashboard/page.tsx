import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  const stats = [
    { label: 'Student Count', value: '42', icon: '👨‍🎓', change: '+12% from last month' },
    { label: 'Teacher Count', value: '8', icon: '👩‍🏫', change: '2 active departments' },
    { label: 'Subjects', value: '1 (Mathematics)', icon: '📚', change: 'Foundations chapter ready' },
    { label: 'Learning Progress', value: '68%', icon: '📈', change: 'Average mastery level' },
  ];

  const recentActivities = [
    { student: 'Alex Johnson', action: 'Completed Addition assessment', score: '95%', time: '10 mins ago' },
    { student: 'Maria Garcia', action: 'Started Division learning plan', score: '45%', time: '1 hour ago' },
    { student: 'Sam Smith', action: 'Prerequisite gap detected: Fractions', score: 'Pending', time: '3 hours ago' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-slate-400">Overview of student counts, teachers, curriculum subjects, and overall learning progress.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-5 border border-slate-800 bg-slate-900/60 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
              <div className="text-xs text-indigo-400 mt-1">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Demonstration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
            <h3 className="text-base font-semibold text-white">Recent Student Diagnostic Activity</h3>
            <div className="space-y-3">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{act.student}</div>
                    <div className="text-xs text-slate-400">{act.action}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-indigo-400">{act.score}</div>
                    <div className="text-[11px] text-slate-500">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
            <h3 className="text-base font-semibold text-white">Prerequisite Tree (Math)</h3>
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <span>✅ Addition</span>
                <span>(Level 3 Mastered)</span>
              </div>
              <div className="pl-4 text-slate-500">↓ Prerequisite</div>
              <div className="flex items-center space-x-2 text-amber-400">
                <span>⚠️ Division</span>
                <span>(Level 1 Gap Detected)</span>
              </div>
              <div className="pl-4 text-slate-500">↓ Prerequisite</div>
              <div className="flex items-center space-x-2 text-rose-400">
                <span>🔒 Fractions</span>
                <span>(Locked)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
