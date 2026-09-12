'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function ParentPortalPage() {
  return (
    <AuthGuard allowedRoles={['PARENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Parent Portal</h1>
            <p className="text-sm text-slate-400">Welcome to the Parent Portal. Monitor your child’s diagnostic progress and remediation status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <Link href="/dashboard/parent" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-emerald-500/50 transition">
              <div className="text-2xl mb-2">👪</div>
              <h3 className="text-base font-semibold text-white">Child Progress Overview</h3>
              <p className="text-xs text-slate-400 mt-1">View Alex's current mastery percentage, active gaps, and completed practice modules.</p>
            </Link>

            <div className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="text-base font-semibold text-white">Teacher Communications</h3>
              <p className="text-xs text-slate-400 mt-1">Direct notes and recommendations from Prof. Marcus Vance.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
