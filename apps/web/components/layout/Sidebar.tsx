import React from 'react';
import Link from 'next/link';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Student Portal', href: '/student', icon: '🎓' },
    { label: 'Assessment', href: '/student/assessment', icon: '📝' },
    { label: 'Learning Path', href: '/student/learning', icon: '🛣️' },
    { label: 'Student Progress', href: '/student/progress', icon: '📈' },
    { label: 'Teacher Overview', href: '/teacher', icon: '👩‍🏫' },
    { label: 'Teacher Students', href: '/teacher/students', icon: '👥' },
    { label: 'Admin Console', href: '/admin', icon: '⚙️' },
    { label: 'Curriculum Manager', href: '/admin/curriculum', icon: '📚' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
        <div className="text-xs font-medium text-slate-300">Phase 1 Foundation</div>
        <div className="text-[11px] text-slate-500 mt-0.5">Status: Ready & Operational</div>
      </div>
    </aside>
  );
};
