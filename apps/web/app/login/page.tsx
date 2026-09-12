'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole } from '@/components/auth/AuthContext';

function LoginForm() {
  const { login, registerStudent } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');

  const [activeMode, setActiveMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGrade, setRegGrade] = useState('Grade 6');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    setIsSubmitting(true);
    const success = await registerStudent(regName.trim(), regEmail.trim(), regGrade);
    if (success) {
      router.push('/student/assessment');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 border border-slate-800 bg-slate-900/90 rounded-2xl shadow-2xl backdrop-blur">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center font-bold text-white text-xl mb-3 shadow-lg shadow-indigo-500/30">
            AI
          </div>
          <h2 className="text-2xl font-bold text-white">AI Remedial Learning</h2>
          <p className="text-xs text-slate-400 mt-1">Adaptive Student Remediation Platform</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveMode('LOGIN')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeMode === 'LOGIN' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('REGISTER')}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeMode === 'REGISTER' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ➕ Register Student
          </button>
        </div>

        {activeMode === 'LOGIN' ? (
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
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
              <span>🚀</span>
              <span>Registering creates a student profile & generates your diagnostic path.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name *</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="jordan@remedial.edu"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Grade Level</label>
              <select
                value={regGrade}
                onChange={(e) => setRegGrade(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Set Password *</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
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
              {isSubmitting ? 'Registering Account...' : '🚀 Register & Take AI Assessment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><span className="text-slate-400 text-sm">Loading...</span></div>}>
      <LoginForm />
    </Suspense>
  );
}
