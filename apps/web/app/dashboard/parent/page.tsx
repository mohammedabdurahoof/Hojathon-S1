'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ParentDashboardPage() {
  const parentMetrics = [
    { label: 'Linked Student', value: 'Alex Johnson', change: 'Grade 6 Mathematics', icon: '👦' },
    { label: 'Overall Mastery', value: '68%', change: '+14% progress gain', icon: '🎯' },
    { label: 'Completed Practice', value: '18 Lessons', change: '4 diagnostic sessions', icon: '✅' },
    { label: 'Active Alerts', value: '1 Notice', change: 'Fractions remediation active', icon: '🔔' },
  ];

  return (
    <AuthGuard allowedRoles={['PARENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👪</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Parent Overview Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Track your child’s remedial learning progress, prerequisite mastery gaps, and teacher recommendations.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Parent Restricted Access
            </span>
          </div>

          {/* Parent Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {parentMetrics.map((metric, idx) => (
              <div key={idx} className="p-5 border border-slate-800 bg-slate-900/60 rounded-xl">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">{metric.label}</span>
                  <span className="text-lg">{metric.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2">{metric.value}</div>
                <div className="text-xs text-emerald-400 mt-1">{metric.change}</div>
              </div>
            ))}
          </div>

          {/* Child Activity & Mastery Report */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Alex’s Remediation & Practice Progress</h3>
              <div className="space-y-3">
                {[
                  { title: 'Fractions & Denominators Remediation', date: 'Today', status: 'IN_PROGRESS', detail: 'Alex completed 3 practice questions with 85% accuracy' },
                  { title: 'Long Division Diagnostic Test', date: 'Yesterday', status: 'COMPLETED', detail: 'Gap identified in multi-digit division steps' },
                  { title: 'Addition & Subtraction Foundations', date: '3 days ago', status: 'MASTERED', detail: '100% mastery confirmed by teacher' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.detail}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.status === 'MASTERED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        item.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {item.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Teacher & Platform Notes</h3>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                  <span>💬 Note from Prof. Vance</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "Alex is making great progress on basic arithmetic. We have assigned a targeted 15-minute remedial lesson on fraction denominators."
                </p>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                  Updated 2 hours ago by Math Department
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
