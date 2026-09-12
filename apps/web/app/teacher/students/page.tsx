import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function TeacherStudentsPage() {
  const students = [
    { id: 'std-1', name: 'Alex Johnson', email: 'student@remedial.edu', grade: 'Grade 6', gap: 'Division', status: 'Needs Remediation' },
    { id: 'std-2', name: 'Maria Garcia', email: 'maria@remedial.edu', grade: 'Grade 5', gap: 'Addition', status: 'In Assessment' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Roster</h1>
          <p className="text-sm text-slate-400">Select a student to inspect knowledge gaps and remedial learning plan details.</p>
        </div>

        <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Student Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Assessed Grade</th>
                <th className="p-4">Primary Gap</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-medium text-white">{student.name}</td>
                  <td className="p-4 text-slate-400">{student.email}</td>
                  <td className="p-4">{student.grade}</td>
                  <td className="p-4 text-amber-400 font-semibold">{student.gap}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/teacher/students/${student.id}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
