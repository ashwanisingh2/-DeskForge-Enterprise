import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {computeDashboard} from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const u = await requireUser('report:view');
    const days = Math.min(365, Math.max(7, +(req.nextUrl.searchParams.get('days') ?? '14')));
    const since = new Date(Date.now() - days * 864e5);

    const tickets = await prisma.ticket.findMany({
      where: {deletedAt: null, tenantId: u.tenantId},
      select: {
        id: true, title: true, status: true, priority: true, category: true,
        createdAt: true, updatedAt: true, resolvedAt: true, dueDate: true, slaStatus: true,
        requester: {select: {name: true}},
      },
    });

    const base = computeDashboard(tickets);

    // Top categories (all time).
    const categoryCounts = tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({category, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Average resolution time per priority.
    const resolvedWithTime = tickets.filter(t => t.resolvedAt && t.status === 'RESOLVED');
    const byPriority: Record<string, number[]> = {};
    for (const t of resolvedWithTime) {
      const hrs = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 36e5;
      (byPriority[t.priority] ??= []).push(hrs);
    }
    const resolutionByPriority = (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(priority => ({
      priority,
      avgHrs: byPriority[priority]?.length
        ? +(byPriority[priority].reduce((a, b) => a + b, 0) / byPriority[priority].length).toFixed(1)
        : 0,
    }));

    // Trend scoped to requested period.
    const trendForPeriod = Array.from({length: days > 14 ? 30 : days}, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 864e5);
      const key = d.toDateString();
      return {
        day: d.toLocaleDateString('en', {weekday: 'short', day: 'numeric'}),
        created: tickets.filter(t => t.createdAt.toDateString() === key).length,
        resolved: tickets.filter(t => t.resolvedAt?.toDateString() === key).length,
      };
    });

    return NextResponse.json({...base, topCategories, resolutionByPriority, trendLast14Days: trendForPeriod});
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({error: {code: e?.message || 'UNAUTHORIZED', message: 'Unauthorized'}}, {status});
  }
}
