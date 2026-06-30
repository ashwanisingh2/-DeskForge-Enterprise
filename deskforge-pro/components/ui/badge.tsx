import type {Priority, SLAStatus, TicketStatus} from '@prisma/client';
import {cn} from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-300',
  purple: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
};

export function Badge({tone = 'neutral', className, ...props}: {tone?: Tone} & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', tones[tone], className)} {...props} />;
}

const priorityTone: Record<Priority, Tone> = {LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger'};
const statusTone: Record<TicketStatus, Tone> = {
  OPEN: 'info',
  ASSIGNED: 'info',
  IN_PROGRESS: 'purple',
  PENDING: 'warning',
  PENDING_CUSTOMER: 'warning',
  ON_HOLD: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};
const slaTone: Record<SLAStatus, Tone> = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  WARNING: 'warning',
  CRITICAL: 'danger',
  BREACHED: 'danger',
};

const label = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function PriorityBadge({value}: {value: Priority}) {
  return <Badge tone={priorityTone[value] ?? 'neutral'}>{label(value)}</Badge>;
}

export function StatusBadge({value}: {value: TicketStatus}) {
  return <Badge tone={statusTone[value] ?? 'neutral'}>{label(value)}</Badge>;
}

export function SlaBadge({value}: {value: SLAStatus}) {
  return <Badge tone={slaTone[value] ?? 'neutral'}>{label(value)}</Badge>;
}
