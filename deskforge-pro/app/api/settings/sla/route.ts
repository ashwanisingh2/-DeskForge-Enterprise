import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {demoSlaConfigs, isLocalDemo} from '@/lib/demo-data';

const schema = z.object({
  configs: z
    .array(
      z.object({
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        responseTimeHrs: z.number().int().min(1).max(720),
        resolutionTimeHrs: z.number().int().min(1).max(2160),
      }),
    )
    .max(4),
});

export async function GET() {
  try {
    if (isLocalDemo()) return NextResponse.json({configs: demoSlaConfigs});
    const u = await requireUser('settings:admin');
    const configs = await prisma.sLAConfig.findMany({where: {tenantId: u.tenantId}});
    return NextResponse.json({configs});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function PUT(req: NextRequest) {
  try {
    const {configs} = schema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({ok: true, configs});
    const u = await requireUser('settings:admin');
    await prisma.$transaction(
      configs.map((c) =>
        prisma.sLAConfig.upsert({
          where: {tenantId_priority: {tenantId: u.tenantId, priority: c.priority}},
          update: {responseTimeHrs: c.responseTimeHrs, resolutionTimeHrs: c.resolutionTimeHrs},
          create: {tenantId: u.tenantId, ...c},
        }),
      ),
    );
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'UPDATE', entityType: 'SLAConfig', entityId: 'policy', newValue: {configs}}});
    return NextResponse.json({ok: true, configs});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
