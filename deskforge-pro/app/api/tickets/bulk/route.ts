import {NextRequest, NextResponse} from 'next/server';
import {Prisma, TicketStatus} from '@prisma/client';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {canTransition, allowedTransitions, lifecycleDates} from '@/lib/ticket-lifecycle';
import {structuredError} from '@/lib/api-errors';
import {isLocalDemo} from '@/lib/demo-data';

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(['status', 'priority', 'assignee', 'delete']),
  value: z.string().nullable().optional(),
});

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const statuses = Object.values(TicketStatus);

export async function POST(req: NextRequest) {
  try {
    const body = bulkSchema.parse(await req.json());
    const permission = body.action === 'delete' ? 'ticket:delete' : 'ticket:update';
    const u = await requireUser(permission);

    if (isLocalDemo()) {
      return NextResponse.json({updated: body.ids.length, skipped: [], action: body.action});
    }

    const tickets = await prisma.ticket.findMany({
      where: {id: {in: body.ids}, tenantId: u.tenantId, deletedAt: null},
      select: {id: true, status: true, priority: true, assigneeId: true, requesterId: true, resolvedAt: true},
    });

    if (tickets.length === 0) {
      return NextResponse.json({error: {code: 'NOT_FOUND', message: 'No matching tickets'}}, {status: 404});
    }

    const skipped: {id: string; reason: string}[] = [];
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      const auditEntries: Prisma.AuditLogCreateManyInput[] = [];
      const recordAudit = (entityId: string, oldValue: Prisma.InputJsonValue, newValue: Prisma.InputJsonValue) =>
        auditEntries.push({tenantId: u.tenantId, userId: u.id, action: 'BULK_UPDATE', entityType: 'Ticket', entityId, oldValue, newValue});

      if (body.action === 'delete') {
        for (const t of tickets) {
          await tx.ticket.update({where: {id: t.id}, data: {deletedAt: new Date()}});
          recordAudit(t.id, {status: t.status}, {deletedAt: 'soft-deleted'});
          updated++;
        }
      }

      if (body.action === 'priority') {
        if (!priorities.includes(body.value as (typeof priorities)[number])) throw new Error('INVALID_PRIORITY');
        for (const t of tickets) {
          if (t.priority === body.value) {
            skipped.push({id: t.id, reason: 'unchanged'});
            continue;
          }
          await tx.ticket.update({
            where: {id: t.id},
            data: {priority: body.value as (typeof priorities)[number], activityLogs: {create: {action: 'priority_changed', detail: 'Bulk priority update', oldValue: t.priority, newValue: String(body.value), userId: u.id}}},
          });
          recordAudit(t.id, {priority: t.priority}, {priority: body.value});
          updated++;
        }
      }

      if (body.action === 'assignee') {
        const assigneeId = body.value && body.value !== 'unassigned' ? body.value : null;
        if (assigneeId) {
          const assignee = await tx.user.findFirst({where: {id: assigneeId, tenantId: u.tenantId, isActive: true}, select: {id: true}});
          if (!assignee) throw new Error('INVALID_ASSIGNEE');
        }
        for (const t of tickets) {
          if (t.assigneeId === assigneeId) {
            skipped.push({id: t.id, reason: 'unchanged'});
            continue;
          }
          await tx.ticket.update({
            where: {id: t.id},
            data: {assigneeId, activityLogs: {create: {action: 'assignee_changed', detail: 'Bulk assignment', oldValue: t.assigneeId ?? '', newValue: assigneeId ?? '', userId: u.id}}},
          });
          recordAudit(t.id, {assigneeId: t.assigneeId}, {assigneeId});
          updated++;
        }
      }

      if (body.action === 'status') {
        const to = body.value as TicketStatus;
        if (!statuses.includes(to)) throw new Error('INVALID_STATUS');
        for (const t of tickets) {
          if (t.status === to) {
            skipped.push({id: t.id, reason: 'unchanged'});
            continue;
          }
          if (!allowedTransitions(t.status).includes(to)) {
            skipped.push({id: t.id, reason: `invalid transition from ${t.status}`});
            continue;
          }
          if (!canTransition(u, t, to)) {
            skipped.push({id: t.id, reason: 'not permitted'});
            continue;
          }
          await tx.ticket.update({
            where: {id: t.id},
            data: {status: to, ...lifecycleDates(to), activityLogs: {create: {action: 'status_changed', detail: 'Bulk status update', oldValue: t.status, newValue: to, userId: u.id}}},
          });
          recordAudit(t.id, {status: t.status}, {status: to});
          updated++;
        }
      }

      if (auditEntries.length) await tx.auditLog.createMany({data: auditEntries});
    });

    return NextResponse.json({updated, skipped, action: body.action});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
