'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
            <p className="text-sm text-slate-400">Manage platform curriculum, user accounts, and system configuration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <Link href="/admin/curriculum" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="text-base font-semibold text-white">Curriculum & Concept Graph</h3>
              <p className="text-xs text-slate-400 mt-1">Configure subjects, chapters, topics, concepts, and prerequisite mappings.</p>
            </Link>

            <Link href="/dashboard/admin" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="text-base font-semibold text-white">System Telemetry & Audit</h3>
              <p className="text-xs text-slate-400 mt-1">View Redis queue status, system metrics, and security audit logs.</p>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
