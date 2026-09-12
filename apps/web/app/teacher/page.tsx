import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function TeacherOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Teacher Overview</h1>
          <p className="text-sm text-slate-400">Monitor student progress, knowledge gaps, and remedial learning plan assignments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <Link href="/teacher/students" className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-indigo-500/50 transition">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-base font-semibold text-white">Student Roster</h3>
            <p className="text-xs text-slate-400 mt-1">View list of assigned students and their current mastery status.</p>
          </Link>

          <div className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-base font-semibold text-white">Class Gap Analytics</h3>
            <p className="text-xs text-slate-400 mt-1">Common prerequisite gaps: Division (42%), Fractions (68%).</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
