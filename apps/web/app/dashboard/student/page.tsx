'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const studentStats = [
    { label: 'Overall Mastery', value: '68%', change: '+14% remediation gain', icon: '🎯' },
    { label: 'Current Topic', value: 'Fractions & Division', change: 'Grade 6 Mathematics', icon: '📖' },
    { label: 'Active Remediation', value: '2 Lessons', change: 'Prerequisite Gap Fix', icon: '🛣️' },
    { label: 'AI Tutor Session', value: 'Active', change: 'Ready for questions', icon: '🤖' },
  ];

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎓</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">Student Learning Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Your personalized diagnostic learning path, active remediation lessons, and AI Tutor assistant.
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              Student Restricted Access
            </span>
          </div>

          {/* Student Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {studentStats.map((stat, idx) => (
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

          {/* Learning Path & Diagnostic Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Your Personalized Remediation Path</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Diagnostic Test #1 — Basic Arithmetic</div>
                    <div className="text-xs text-slate-400 mt-0.5">Identified root gap: Division with Remainders</div>
                  </div>
                  <Link
                    href="/student/assessment"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Start Test
                  </Link>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Remedial Lesson — Fraction Denominators</div>
                    <div className="text-xs text-slate-400 mt-0.5">Interactive step-by-step AI guided lesson</div>
                  </div>
                  <Link
                    href="/student/learning"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Continue Lesson
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Prerequisite Tree</h3>
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                  <span>✅ Addition & Subtraction</span>
                  <span>(100% Mastered)</span>
                </div>
                <div className="pl-4 text-slate-500">↓ Prerequisite</div>
                <div className="flex items-center space-x-2 text-amber-400 font-medium">
                  <span>⚠️ Long Division</span>
                  <span>(54% Gap Detected)</span>
                </div>
                <div className="pl-4 text-slate-500">↓ Prerequisite</div>
                <div className="flex items-center space-x-2 text-rose-400 font-medium">
                  <span>🔒 Fractions & Decimals</span>
                  <span>(In Remediation)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
