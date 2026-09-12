import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AdminCurriculumPage() {
  const concepts = [
    { code: 'MATH-ADD-01', name: 'Addition', topic: 'Arithmetic', prerequisite: 'None (Root Node)' },
    { code: 'MATH-DIV-01', name: 'Division', topic: 'Arithmetic', prerequisite: 'Addition (MATH-ADD-01)' },
    { code: 'MATH-FRAC-01', name: 'Fractions', topic: 'Fractions', prerequisite: 'Division (MATH-DIV-01)' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Curriculum & Concept Prerequisite Graph</h1>
          <p className="text-sm text-slate-400">View and manage concepts and prerequisite dependencies powering knowledge gap detection.</p>
        </div>

        <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Concept Code</th>
                <th className="p-4">Concept Name</th>
                <th className="p-4">Topic</th>
                <th className="p-4">Prerequisite Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {concepts.map((concept) => (
                <tr key={concept.code} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono text-indigo-400 font-semibold">{concept.code}</td>
                  <td className="p-4 font-medium text-white">{concept.name}</td>
                  <td className="p-4">{concept.topic}</td>
                  <td className="p-4 text-emerald-400 font-medium">{concept.prerequisite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
