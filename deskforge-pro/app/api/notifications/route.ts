import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {demoNotifications, isLocalDemo} from '@/lib/demo-data';

// In-memory demo notification state.
let demoState = demoNotifications.map((n) => ({...n}));

export async function GET() {
  try {
    if (isLocalDemo()) {
      return NextResponse.json({notifications: demoState, unread: demoState.filter((n) => !n.isRead).length});
    }
    const u = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: {tenantId: u.tenantId, userId: u.id},
      orderBy: {createdAt: 'desc'},
      take: 30,
    });
    const unread = await prisma.notification.count({where: {tenantId: u.tenantId, userId: u.id, isRead: false}});
    return NextResponse.json({notifications, unread});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

/** Mark notifications as read. Body: {id?: string} — omit id to mark all read. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (isLocalDemo()) {
      demoState = demoState.map((n) => (!body.id || n.id === body.id ? {...n, isRead: true} : n));
      return NextResponse.json({notifications: demoState, unread: demoState.filter((n) => !n.isRead).length});
    }
    const u = await requireUser();
    await prisma.notification.updateMany({
      where: {tenantId: u.tenantId, userId: u.id, ...(body.id ? {id: body.id} : {})},
      data: {isRead: true},
    });
    return NextResponse.json({ok: true});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}
