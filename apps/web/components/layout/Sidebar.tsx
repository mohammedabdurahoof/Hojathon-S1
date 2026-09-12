'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '../auth/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    // Admin Routes
    { label: 'Admin Console', href: '/dashboard/admin', icon: '⚙️', roles: ['ADMIN'] },
    { label: 'Curriculum Manager', href: '/admin/curriculum', icon: '📚', roles: ['ADMIN'] },

    // Teacher Routes
    { label: 'Teacher Dashboard', href: '/dashboard/teacher', icon: '👩‍🏫', roles: ['TEACHER'] },
    { label: 'Class Students', href: '/teacher/students', icon: '👥', roles: ['TEACHER'] },

    // Student Routes
    { label: 'Student Dashboard', href: '/dashboard/student', icon: '🎓', roles: ['STUDENT'] },
    { label: 'Diagnostic Test', href: '/student/assessment', icon: '📝', roles: ['STUDENT'] },
    { label: 'Learning Path', href: '/student/learning', icon: '🛣️', roles: ['STUDENT'] },
    { label: 'Mastery Progress', href: '/student/progress', icon: '📈', roles: ['STUDENT'] },

    // Parent Routes
    { label: 'Parent Dashboard', href: '/dashboard/parent', icon: '👪', roles: ['PARENT'] },
  ];

  const userRole = user?.role || 'STUDENT';
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>{userRole} Navigation</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
        <div className="text-xs font-semibold text-slate-300">Phase 8 Production</div>
        <div className="text-[11px] text-slate-400">Auth Guard & Role RBAC</div>
        <div className="text-[10px] text-emerald-400 font-medium">● Protected & Authenticated</div>
      </div>
    </aside>
  );
};
