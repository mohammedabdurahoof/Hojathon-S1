'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardRouterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

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
        router.replace('/dashboard/student');
    }
  }, [user, isLoading, router]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-slate-400">Redirecting to your role dashboard...</div>
      </div>
    </AuthGuard>
  );
}
