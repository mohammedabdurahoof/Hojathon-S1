'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function TeacherDashboardPage() {
  const teacherStats = [
    { label: 'Assigned Students', value: '42 Students', change: 'Grade 6 Math', icon: '👥' },
    { label: 'Struggling / At Risk', value: '5 Students', change: 'Prerequisite Gaps', icon: '⚠️' },
    { label: 'Pending Interventions', value: '3 Actionable', change: 'Requires Teacher Review', icon: '📋' },
    { label: 'Class Average Mastery', value: '72%', change: '+4% this week', icon: '📈' },
  ];

  const strugglingStudents = [
    { name: 'Alex Johnson', risk: 'CRITICAL', gap: 'Fractions Denominator Confusion', score: 42, action: 'Assign Remediation' },
    { name: 'Sam Smith', risk: 'AT_RISK', gap: 'Long Division Steps', score: 54, action: 'Schedule Review' },
    { name: 'Maria Garcia', risk: 'WATCH', gap: 'Decimal Place Value', score: 68, action: 'Monitor' },
  ];

  return (
    <AuthGuard allowedRoles={['TEACHER']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👩‍🏫</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Teacher Intelligence Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Monitor student risk levels, prerequisite gap trees, active interventions, and class mastery metrics.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Teacher Restricted Access
            </span>
          </div>

          {/* Teacher Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teacherStats.map((stat, idx) => (
              <div key={idx} className="p-5 border border-slate-800 bg-slate-900/60 rounded-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
                <div className="text-xs text-purple-400 mt-1">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* At-Risk Students & Interventions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Student Risk Breakdown & Needed Interventions</h3>
              <div className="space-y-3">
                {strugglingStudents.map((st, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{st.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          st.risk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          st.risk === 'AT_RISK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {st.risk}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Root Cause Gap: <span className="text-slate-200">{st.gap}</span></div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{st.score}%</div>
                        <div className="text-[10px] text-slate-500">Mastery</div>
                      </div>
                      <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition">
                        {st.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Teacher Action Center</h3>
              <div className="space-y-3 text-xs">
                <button className="w-full p-3 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg text-left transition text-indigo-200">
                  <div className="font-semibold">📚 Upload Curriculum Document</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ingest new textbook/lesson PDF into RAG engine</div>
                </button>
                <button className="w-full p-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg text-left transition text-purple-200">
                  <div className="font-semibold">⚡ Create Diagnostic Assessment</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Generate adaptive assessment for Grade 6 Math</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
