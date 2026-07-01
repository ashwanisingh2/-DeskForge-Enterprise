import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {demoAgents, demoManagedUsers, isLocalDemo} from '@/lib/demo-data';

const manageSelect = {id: true, name: true, email: true, username: true, role: true, department: true, isActive: true, createdAt: true} as const;

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  username: z.string().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, dot, dash and underscore only'),
  password: z.string().min(8).max(100),
  role: z.enum(['ADMIN', 'AGENT', 'END_USER']).default('END_USER'),
  department: z.string().max(80).optional(),
});

/**
 * Default GET returns assignable agents for pickers (ticket:read:any).
 * `?scope=manage` returns the full user roster for administration (user:manage).
 */
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get('scope');

    if (scope === 'manage') {
      if (isLocalDemo()) return NextResponse.json({users: demoManagedUsers});
      const u = await requireUser('user:manage');
      const users = await prisma.user.findMany({where: {tenantId: u.tenantId}, select: manageSelect, orderBy: {name: 'asc'}});
      return NextResponse.json({users});
    }

    if (isLocalDemo()) return NextResponse.json({users: demoAgents});
    const u = await requireUser('ticket:read:any');
    const users = await prisma.user.findMany({
      where: {tenantId: u.tenantId, isActive: true, role: {in: ['AGENT', 'ADMIN']}},
      select: {id: true, name: true, role: true},
      orderBy: {name: 'asc'},
    });
    return NextResponse.json({users});
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({error: {code: e?.message || 'UNAUTHORIZED', message: 'Unauthorized'}}, {status});
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = createUserSchema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({id: 'demo', ...data, password: undefined}, {status: 201});
    const u = await requireUser('user:manage');
    const password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        password,
        role: data.role,
        department: data.department,
        tenantId: u.tenantId,
      },
      select: manageSelect,
    });
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'CREATE', entityType: 'User', entityId: user.id, newValue: {username: user.username, role: user.role}}});
    return NextResponse.json(user, {status: 201});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : e?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
