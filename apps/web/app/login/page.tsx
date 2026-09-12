'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole } from '@/components/auth/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');

  const [email, setEmail] = useState('student@remedial.edu');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(email, password, selectedRole);
    if (success) {
      if (redirectParam) {
        router.push(decodeURIComponent(redirectParam));
      } else {
        if (selectedRole === 'ADMIN') router.push('/dashboard/admin');
        else if (selectedRole === 'TEACHER') router.push('/dashboard/teacher');
        else if (selectedRole === 'STUDENT') router.push('/dashboard/student');
        else if (selectedRole === 'PARENT') router.push('/dashboard/parent');
        else router.push('/dashboard');
      }
    }
    setIsSubmitting(false);
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsSubmitting(true);
    const demoEmails: Record<UserRole, string> = {
      ADMIN: 'admin@remedial.edu',
      TEACHER: 'teacher@remedial.edu',
      STUDENT: 'student@remedial.edu',
      PARENT: 'parent@remedial.edu',
    };

    setSelectedRole(role);
    setEmail(demoEmails[role]);

    await login(demoEmails[role], 'password123', role);

    if (role === 'ADMIN') router.push('/dashboard/admin');
    else if (role === 'TEACHER') router.push('/dashboard/teacher');
    else if (role === 'STUDENT') router.push('/dashboard/student');
    else if (role === 'PARENT') router.push('/dashboard/parent');
    else router.push('/dashboard');

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 border border-slate-800 bg-slate-900/90 rounded-2xl shadow-2xl backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center font-bold text-white text-xl mb-3 shadow-lg shadow-indigo-500/30">
            AI
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Platform</h2>
          <p className="text-xs text-slate-400 mt-1">AI Remedial Learning Platform Portal</p>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center">
            ⚡ Quick Demo Access — Select Role Dashboard:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold transition text-center"
            >
              👑 Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('TEACHER')}
              className="p-2.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-semibold transition text-center"
            >
              👩‍🏫 Teacher Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT')}
              className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold transition text-center"
            >
              👨‍🎓 Student Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('PARENT')}
              className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold transition text-center"
            >
              👪 Parent Dashboard
            </button>
          </div>
        </div>

        <div className="relative my-6 text-center text-xs text-slate-500">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <span className="relative bg-slate-900 px-3">or sign in with credentials</span>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Account Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ADMIN">👑 Administrator</option>
              <option value="TEACHER">👩‍🏫 Teacher</option>
              <option value="STUDENT">👨‍🎓 Student</option>
              <option value="PARENT">👪 Parent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@remedial.edu"
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing In...' : `Sign In as ${selectedRole}`}
          </button>
        </form>
      </div>
    </div>
  );
}
