import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            AI
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">
            AI Remedial Learning Platform
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          Sign In
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
};
