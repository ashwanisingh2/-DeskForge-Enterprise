import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {sanitizeHtml} from '@/lib/sanitize';
import {structuredError} from '@/lib/api-errors';
import {demoCannedResponses, isLocalDemo} from '@/lib/demo-data';

const schema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(2).max(5000).transform(sanitizeHtml),
  category: z.string().max(60).optional(),
});

export async function GET() {
  try {
    if (isLocalDemo()) return NextResponse.json({responses: demoCannedResponses});
    const u = await requireUser('settings:admin');
    const responses = await prisma.cannedResponse.findMany({where: {tenantId: u.tenantId}, orderBy: {createdAt: 'desc'}});
    return NextResponse.json({responses});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({id: 'demo', ...data}, {status: 201});
    const u = await requireUser('settings:admin');
    const response = await prisma.cannedResponse.create({data: {...data, tenantId: u.tenantId}});
    return NextResponse.json(response, {status: 201});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({error: {code: 'ID_REQUIRED', message: 'id is required'}}, {status: 400});
    if (isLocalDemo()) return NextResponse.json({ok: true});
    const u = await requireUser('settings:admin');
    await prisma.cannedResponse.deleteMany({where: {id, tenantId: u.tenantId}});
    return NextResponse.json({ok: true});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 400});
  }
}
