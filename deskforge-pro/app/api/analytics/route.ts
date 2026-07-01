import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {computeDashboard} from '@/lib/analytics';

export async function GET() {
  try {
    const u = await requireUser('report:view');
    const tickets = await prisma.ticket.findMany({
      where: {deletedAt: null, tenantId: u.tenantId},
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        dueDate: true,
        slaStatus: true,
        requester: {select: {name: true}},
      },
    });
    return NextResponse.json(computeDashboard(tickets));
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({error: {code: e?.message || 'UNAUTHORIZED', message: 'Unauthorized'}}, {status});
  }
}
