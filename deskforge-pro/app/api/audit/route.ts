import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {demoAuditLogs, isLocalDemo} from '@/lib/demo-data';

export async function GET(req: NextRequest) {
  try {
    if (isLocalDemo()) return NextResponse.json({logs: demoAuditLogs, total: demoAuditLogs.length, page: 1, totalPages: 1});
    const u = await requireUser('settings:admin');
    const q = req.nextUrl.searchParams;
    const page = Math.max(1, +(q.get('page') || 1));
    const limit = Math.min(100, Math.max(1, +(q.get('limit') || 50)));
    const where: any = {tenantId: u.tenantId};
    if (q.get('entityType')) where.entityType = q.get('entityType');
    if (q.get('action')) where.action = q.get('action');
    if (q.get('search')) where.entityId = {contains: q.get('search')!, mode: 'insensitive'};
    if (q.get('dateFrom') || q.get('dateTo')) {
      where.createdAt = {
        ...(q.get('dateFrom') && {gte: new Date(q.get('dateFrom')!)}),
        ...(q.get('dateTo') && {lte: new Date(`${q.get('dateTo')!}T23:59:59`)}),
      };
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {user: {select: {name: true}}},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({where}),
    ]);
    return NextResponse.json({logs, total, page, totalPages: Math.max(1, Math.ceil(total / limit))});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}
