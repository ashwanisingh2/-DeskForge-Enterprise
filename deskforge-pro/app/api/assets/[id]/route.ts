import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {assetSchema} from '../route';
import {demoAssetRecords, isLocalDemo} from '@/lib/demo-data';

const ciSelect = {select: {id: true, assetTag: true, name: true, type: true, status: true}};
const PATCH_FIELDS = ['assetTag', 'name', 'type', 'serialNumber', 'status', 'ownerId', 'purchaseDate', 'warrantyEnd'] as const;

export async function GET(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    if (isLocalDemo()) {
      const demo = demoAssetRecords.find((a) => a.id === id);
      return demo ? NextResponse.json(demo) : NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    }
    const u = await requireUser('asset:read');
    const asset = await prisma.asset.findFirst({
      where: {id, tenantId: u.tenantId},
      include: {owner: {select: {id: true, name: true}}, relationships: {include: {target: ciSelect}}, relatedFrom: {include: {source: ciSelect}}},
    });
    return asset ? NextResponse.json(asset) : NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function PATCH(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('asset:admin');
    const existing = await prisma.asset.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    const parsed = assetSchema.partial().parse(await req.json());
    const data: Record<string, unknown> = {};
    for (const key of PATCH_FIELDS) if (key in parsed) data[key] = (parsed as any)[key];
    const asset = await prisma.asset.update({where: {id}, data});
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'UPDATE', entityType: 'Asset', entityId: id, newValue: data as Prisma.InputJsonObject}});
    return NextResponse.json(asset);
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : e?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

export async function DELETE(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('asset:admin');
    const existing = await prisma.asset.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    await prisma.$transaction([
      prisma.asset.delete({where: {id}}),
      prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'DELETE', entityType: 'Asset', entityId: id, oldValue: {assetTag: existing.assetTag, name: existing.name}}}),
    ]);
    return NextResponse.json({ok: true});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
