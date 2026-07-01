import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {sanitizeHtml} from '@/lib/sanitize';
import {structuredError} from '@/lib/api-errors';
import {demoCatalogItems, isLocalDemo} from '@/lib/demo-data';

const updateSchema = z.object({
  name: z.string().min(3).max(150).optional(),
  description: z.string().min(10).transform(sanitizeHtml).optional(),
  category: z.string().min(2).max(60).optional(),
  fulfillmentTeam: z.string().max(80).nullable().optional(),
  deliveryHours: z.number().int().positive().nullable().optional(),
  cost: z.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
});

const FIELDS = ['name', 'description', 'category', 'fulfillmentTeam', 'deliveryHours', 'cost', 'isActive'] as const;

export async function GET(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    if (isLocalDemo()) {
      const item = demoCatalogItems.find((i) => i.id === id);
      return item ? NextResponse.json(item) : NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    }
    const u = await requireUser();
    const item = await prisma.serviceCatalogItem.findFirst({where: {id, tenantId: u.tenantId}});
    return item ? NextResponse.json(item) : NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function PATCH(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const parsed = updateSchema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({id, ...parsed});
    const u = await requireUser('catalog:manage');
    const existing = await prisma.serviceCatalogItem.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    const data: Record<string, unknown> = {};
    for (const key of FIELDS) if (key in parsed) data[key] = (parsed as any)[key];
    const item = await prisma.serviceCatalogItem.update({where: {id}, data});
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'UPDATE', entityType: 'CatalogItem', entityId: id, newValue: data as Prisma.InputJsonObject}});
    return NextResponse.json(item);
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

export async function DELETE(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    if (isLocalDemo()) return NextResponse.json({ok: true});
    const u = await requireUser('catalog:manage');
    const existing = await prisma.serviceCatalogItem.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    // Soft-deactivate to keep historical requests intact.
    await prisma.serviceCatalogItem.update({where: {id}, data: {isActive: false}});
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'DEACTIVATE', entityType: 'CatalogItem', entityId: id, oldValue: {name: existing.name}}});
    return NextResponse.json({ok: true});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
