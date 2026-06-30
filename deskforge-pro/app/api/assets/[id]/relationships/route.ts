import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';

export const CI_RELATIONSHIP_TYPES = ['DEPENDS_ON', 'CONNECTS_TO', 'RUNS_ON', 'HOSTED_ON', 'PART_OF', 'BACKS_UP'] as const;

const schema = z.object({
  targetId: z.string().min(2),
  type: z.enum(CI_RELATIONSHIP_TYPES),
});

export async function POST(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('asset:admin');
    const data = schema.parse(await req.json());
    if (data.targetId === id) return NextResponse.json({error: {code: 'SELF_LINK', message: 'Cannot link an asset to itself'}}, {status: 400});
    const assets = await prisma.asset.findMany({where: {tenantId: u.tenantId, id: {in: [id, data.targetId]}}, select: {id: true}});
    if (assets.length !== 2) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Asset not found'}}, {status: 404});
    const relationship = await prisma.$transaction(async (tx) => {
      const created = await tx.cIRelationship.create({data: {sourceId: id, targetId: data.targetId, type: data.type}});
      await tx.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'CI_LINK', entityType: 'Asset', entityId: id, newValue: {targetId: data.targetId, type: data.type}}});
      return created;
    });
    return NextResponse.json(relationship, {status: 201});
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : e?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

export async function DELETE(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('asset:admin');
    const relId = req.nextUrl.searchParams.get('relId');
    if (!relId) return NextResponse.json({error: {code: 'REL_ID_REQUIRED', message: 'relId is required'}}, {status: 400});
    const rel = await prisma.cIRelationship.findFirst({where: {id: relId, source: {id, tenantId: u.tenantId}}});
    if (!rel) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Relationship not found'}}, {status: 404});
    await prisma.$transaction([
      prisma.cIRelationship.delete({where: {id: rel.id}}),
      prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'CI_UNLINK', entityType: 'Asset', entityId: id, oldValue: {targetId: rel.targetId, type: rel.type}}}),
    ]);
    return NextResponse.json({ok: true});
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
