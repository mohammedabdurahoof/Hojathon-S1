import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this section.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-rose-900/50 bg-rose-950/20 rounded-xl text-center">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl mb-3">
        ⚠️
      </div>
      <h4 className="text-base font-semibold text-rose-300">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
