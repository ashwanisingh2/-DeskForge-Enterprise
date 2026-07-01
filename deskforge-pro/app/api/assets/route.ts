import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {structuredError} from '@/lib/api-errors';
import {demoAssetRecords, isLocalDemo} from '@/lib/demo-data';

export const assetSchema = z.object({
  assetTag: z.string().min(2).max(50),
  name: z.string().min(2).max(150),
  type: z.string().min(2).max(60),
  serialNumber: z.string().max(120).optional(),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'RETIRED', 'MISSING']).default('OPERATIONAL'),
  ownerId: z.string().nullable().optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  warrantyEnd: z.coerce.date().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (isLocalDemo()) return NextResponse.json({assets: demoAssetRecords, total: demoAssetRecords.length, page: 1, totalPages: 1});
    const u = await requireUser('asset:read');
    const q = req.nextUrl.searchParams;
    const page = Math.max(1, +(q.get('page') || 1));
    const limit = Math.min(100, Math.max(1, +(q.get('limit') || 25)));
    const where: any = {tenantId: u.tenantId};
    const search = q.get('search')?.trim();
    if (search) where.OR = [{assetTag: {contains: search, mode: 'insensitive'}}, {name: {contains: search, mode: 'insensitive'}}, {serialNumber: {contains: search, mode: 'insensitive'}}];
    if (q.get('type')) where.type = q.get('type');
    if (q.get('status')) where.status = q.get('status');
    const [assets, total] = await prisma.$transaction([
      prisma.asset.findMany({where, include: {owner: {select: {id: true, name: true}}}, orderBy: {updatedAt: 'desc'}, skip: (page - 1) * limit, take: limit}),
      prisma.asset.count({where}),
    ]);
    return NextResponse.json({assets, total, page, totalPages: Math.max(1, Math.ceil(total / limit))});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser('asset:admin');
    const data = assetSchema.parse(await req.json());
    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({data: {...data, tenantId: u.tenantId}});
      await tx.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'CREATE', entityType: 'Asset', entityId: created.id, newValue: {assetTag: created.assetTag, name: created.name}}});
      return created;
    });
    return NextResponse.json(asset, {status: 201});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : e?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
