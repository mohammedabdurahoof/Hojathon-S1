export * from '@ai-remedial/types';

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateMasteryColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-500 bg-emerald-50';
  if (score >= 60) return 'text-amber-500 bg-amber-50';
  return 'text-rose-500 bg-rose-50';
};
