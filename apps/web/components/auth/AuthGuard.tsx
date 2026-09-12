'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 1. Not logged in -> Redirect to login page
    if (!user) {
      const redirectUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirectUrl}`);
      return;
    }

    // 2. Logged in, but trying to access an unauthorized role dashboard
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect to their own role dashboard
      switch (user.role) {
        case 'ADMIN':
          router.replace('/dashboard/admin');
          break;
        case 'TEACHER':
          router.replace('/dashboard/teacher');
          break;
        case 'STUDENT':
          router.replace('/dashboard/student');
          break;
        case 'PARENT':
          router.replace('/dashboard/parent');
          break;
        default:
          router.replace('/dashboard');
      }
    }
  }, [user, isLoading, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-slate-400">Verifying session & permissions...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-4 border border-rose-500/30">
          🚫
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Your account role (<span className="text-indigo-400 font-semibold">{user.role}</span>) does not have permission to view this dashboard.
        </p>
        <button
          onClick={() => {
            if (user.role === 'ADMIN') router.push('/dashboard/admin');
            else if (user.role === 'TEACHER') router.push('/dashboard/teacher');
            else if (user.role === 'STUDENT') router.push('/dashboard/student');
            else if (user.role === 'PARENT') router.push('/dashboard/parent');
            else router.push('/dashboard');
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
        >
          Go to Your Dashboard ({user.role})
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
