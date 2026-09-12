'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function StudentPortalPage() {
  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Student Portal</h1>
            <p className="text-sm text-slate-400">Welcome back. View your assessment status, active learning plan, and concept progress.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/student/assessment" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="text-base font-semibold text-white">Diagnostic Assessment</h3>
              <p className="text-xs text-slate-400 mt-1">Take adaptive assessments to identify current knowledge gaps.</p>
            </Link>

            <Link href="/student/learning" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
              <div className="text-2xl mb-2">🛣️</div>
              <h3 className="text-base font-semibold text-white">Personalized Learning Plan</h3>
              <p className="text-xs text-slate-400 mt-1">Follow tailored prerequisite concept modules.</p>
            </Link>

            <Link href="/student/progress" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="text-base font-semibold text-white">Mastery Progress</h3>
              <p className="text-xs text-slate-400 mt-1">Track concept mastery and skill level updates.</p>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
