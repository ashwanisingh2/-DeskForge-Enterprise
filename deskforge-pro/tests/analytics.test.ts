import {describe, expect, it} from 'vitest';
import {computeDashboard, type TicketForAnalytics} from '../lib/analytics';

const base = (over: Partial<TicketForAnalytics>): TicketForAnalytics => ({
  id: 'TKT-0001',
  title: 'Sample',
  status: 'OPEN',
  priority: 'MEDIUM',
  category: 'Network',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  resolvedAt: null,
  dueDate: null,
  slaStatus: 'ON_TRACK',
  requester: {name: 'Rahul'},
  ...over,
});

describe('computeDashboard', () => {
  it('aggregates counts, SLA compliance and resolution time', () => {
    const now = new Date();
    const tickets: TicketForAnalytics[] = [
      base({id: 'TKT-0001', status: 'OPEN', priority: 'CRITICAL'}),
      base({id: 'TKT-0002', status: 'IN_PROGRESS', priority: 'HIGH'}),
      base({
        id: 'TKT-0003',
        status: 'RESOLVED',
        createdAt: new Date(now.getTime() - 2 * 36e5),
        resolvedAt: now,
        updatedAt: now,
      }),
      base({id: 'TKT-0004', status: 'OPEN', slaStatus: 'BREACHED', dueDate: new Date(now.getTime() - 36e5)}),
    ];

    const d = computeDashboard(tickets);

    expect(d.totalTickets).toBe(4);
    expect(d.openTickets).toBe(2);
    expect(d.inProgressTickets).toBe(1);
    expect(d.criticalOpen).toBe(1);
    expect(d.slaBreached).toBe(1);
    expect(d.overdueTickets).toBe(1);
    expect(d.resolvedToday).toBe(1);
    expect(d.avgResolutionTime).toBe(2);
    expect(d.slaCompliance).toBe(75);
    expect(d.trendLast14Days).toHaveLength(14);
    expect(d.recentTickets.length).toBeLessThanOrEqual(6);
  });

  it('handles an empty dataset without dividing by zero', () => {
    const d = computeDashboard([]);
    expect(d.totalTickets).toBe(0);
    expect(d.avgResolutionTime).toBe(0);
    expect(d.slaCompliance).toBe(100);
    expect(d.recentTickets).toEqual([]);
  });
});
