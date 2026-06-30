import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {isLocalDemo} from '@/lib/demo-data';

const manageSelect = {id: true, name: true, email: true, username: true, role: true, department: true, isActive: true, createdAt: true} as const;

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(['ADMIN', 'AGENT', 'END_USER']).optional(),
  department: z.string().max(80).nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
});

export async function PATCH(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const parsed = updateSchema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({id, ...parsed, password: undefined});
    const u = await requireUser('user:manage');

    // Prevent administrators from locking themselves out.
    if (id === u.id && (parsed.isActive === false || (parsed.role && parsed.role !== 'ADMIN'))) {
      return NextResponse.json({error: {code: 'SELF_LOCKOUT', message: 'You cannot deactivate or demote your own account'}}, {status: 400});
    }

    const existing = await prisma.user.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'User not found'}}, {status: 404});

    const data: Record<string, unknown> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.role !== undefined) data.role = parsed.role;
    if (parsed.department !== undefined) data.department = parsed.department;
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
    if (parsed.password) data.password = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.update({where: {id}, data, select: manageSelect});
    await prisma.auditLog.create({
      data: {tenantId: u.tenantId, userId: u.id, action: 'UPDATE', entityType: 'User', entityId: id, newValue: {...data, password: data.password ? 'reset' : undefined}},
    });
    return NextResponse.json(user);
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : e?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

/** Deactivates a user (soft) to preserve referential integrity with owned records. */
export async function DELETE(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    if (isLocalDemo()) return NextResponse.json({ok: true});
    const u = await requireUser('user:manage');
    if (id === u.id) return NextResponse.json({error: {code: 'SELF_LOCKOUT', message: 'You cannot deactivate your own account'}}, {status: 400});
    const existing = await prisma.user.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'User not found'}}, {status: 404});
    await prisma.$transaction([
      prisma.user.update({where: {id}, data: {isActive: false}}),
      prisma.refreshToken.updateMany({where: {userId: id, revokedAt: null}, data: {revokedAt: new Date()}}),
      prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'DEACTIVATE', entityType: 'User', entityId: id, oldValue: {username: existing.username}}}),
    ]);
    return NextResponse.json({ok: true});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
