import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function TeacherStudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Link href="/teacher/students" className="text-xs text-indigo-400 hover:underline">
            ← Back to Roster
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Student Details ({params.id})</h1>
          <p className="text-sm text-slate-400">Detailed diagnostic analysis and concept prerequisite gap details for student ID: {params.id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-3">
            <h3 className="text-base font-semibold text-white">Profile Overview</h3>
            <div className="text-xs space-y-1 text-slate-300">
              <div><strong className="text-slate-400">Name:</strong> Alex Johnson</div>
              <div><strong className="text-slate-400">Email:</strong> student@remedial.edu</div>
              <div><strong className="text-slate-400">Current Grade Level:</strong> Grade 6</div>
              <div><strong className="text-slate-400">Target Grade Level:</strong> Grade 8</div>
            </div>
          </div>

          <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl space-y-3">
            <h3 className="text-base font-semibold text-white">Prerequisite Tree & Gap Analysis</h3>
            <div className="p-3 bg-slate-800/40 rounded-lg text-xs space-y-2">
              <div className="text-emerald-400">✔ Addition: Mastered (95%)</div>
              <div className="text-amber-400">❌ Division: Identified Gap (45%)</div>
              <div className="text-slate-500">🔒 Fractions: Blocked by Division prerequisite</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
