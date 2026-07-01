export const PROBLEM_STATUSES = ['INVESTIGATING', 'IDENTIFIED', 'MITIGATED', 'CLOSED'] as const;

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple';

export const problemStatusTone: Record<string, Tone> = {
  INVESTIGATING: 'warning',
  IDENTIFIED: 'info',
  MITIGATED: 'purple',
  CLOSED: 'success',
};

export const humanize = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
