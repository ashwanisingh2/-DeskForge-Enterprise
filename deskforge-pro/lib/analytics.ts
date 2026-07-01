import type {Priority, Ticket, TicketStatus} from '@prisma/client';
import {getSLAStatus} from './sla';

const STATUSES: TicketStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'PENDING_CUSTOMER', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TERMINAL: TicketStatus[] = ['RESOLVED', 'CLOSED'];

export type TicketForAnalytics = Pick<
  Ticket,
  'id' | 'title' | 'status' | 'priority' | 'category' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'dueDate' | 'slaStatus'
> & {requester?: {name: string} | null};

export type DashboardData = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  overdueTickets: number;
  criticalOpen: number;
  slaBreached: number;
  avgResolutionTime: number;
  slaCompliance: number;
  ticketsByStatus: {status: string; count: number}[];
  ticketsByPriority: {priority: string; count: number}[];
  ticketsByCategory: {category: string; count: number}[];
  trendLast14Days: {day: string; created: number; resolved: number}[];
  recentTickets: {id: string; title: string; status: string; priority: string; createdAt: string; requester: string}[];
};

/** Single source of truth for dashboard/analytics aggregation. */
export function computeDashboard(tickets: TicketForAnalytics[]): DashboardData {
  const now = new Date();
  const today = now.toDateString();
  const resolved = tickets.filter((t) => t.status === 'RESOLVED');
  const resolutionHours = resolved
    .filter((t) => t.resolvedAt)
    .map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 36e5);

  const byKey = <T extends string>(keys: T[], pick: (t: TicketForAnalytics) => T) =>
    keys.map((key) => ({key, count: tickets.filter((t) => pick(t) === key).length}));

  const categoryCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});

  const trendLast14Days = Array.from({length: 14}, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 864e5);
    const key = d.toDateString();
    return {
      day: d.toLocaleDateString('en', {weekday: 'short'}),
      created: tickets.filter((t) => t.createdAt.toDateString() === key).length,
      resolved: tickets.filter((t) => t.resolvedAt?.toDateString() === key).length,
    };
  });

  const recentTickets = [...tickets]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      requester: t.requester?.name ?? '—',
    }));

  // SLA is computed live from due date + status so it reflects reality without a cron worker.
  const liveSla = (t: TicketForAnalytics) => getSLAStatus({dueDate: t.dueDate, status: t.status, createdAt: t.createdAt}, now);
  const breached = tickets.filter((t) => liveSla(t) === 'BREACHED').length;

  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter((t) => t.status === 'OPEN').length,
    inProgressTickets: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolvedToday: resolved.filter((t) => t.updatedAt.toDateString() === today).length,
    overdueTickets: tickets.filter((t) => t.dueDate && t.dueDate < now && !TERMINAL.includes(t.status)).length,
    criticalOpen: tickets.filter((t) => t.priority === 'CRITICAL' && !TERMINAL.includes(t.status)).length,
    slaBreached: breached,
    avgResolutionTime: +(resolutionHours.reduce((a, b) => a + b, 0) / (resolutionHours.length || 1)).toFixed(1),
    slaCompliance: tickets.length ? Math.round(((tickets.length - breached) / tickets.length) * 100) : 100,
    ticketsByStatus: byKey(STATUSES, (t) => t.status).map(({key, count}) => ({status: key, count})),
    ticketsByPriority: byKey(PRIORITIES, (t) => t.priority).map(({key, count}) => ({priority: key, count})),
    ticketsByCategory: Object.entries(categoryCounts).map(([category, count]) => ({category, count})),
    trendLast14Days,
    recentTickets,
  };
}
