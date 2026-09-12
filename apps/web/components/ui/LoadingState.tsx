import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading content...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-slate-800 rounded-xl bg-slate-900/40">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
};
