'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '../auth/AuthContext';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleBadgeColor: Record<UserRole, string> = {
    ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    TEACHER: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    STUDENT: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    PARENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            AI
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">
            AI Remedial Platform
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Quick Role Switcher for Demo */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold px-2">Role:</span>
              {(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    if (role === 'ADMIN') router.push('/dashboard/admin');
                    else if (role === 'TEACHER') router.push('/dashboard/teacher');
                    else if (role === 'STUDENT') router.push('/dashboard/student');
                    else if (role === 'PARENT') router.push('/dashboard/parent');
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded transition ${
                    user.role === role
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Profile & Role Badge */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-400">{user.email}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  roleBadgeColor[user.role]
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
