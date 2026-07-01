import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {kbArticleSchema} from '@/lib/validations';
import {structuredError} from '@/lib/api-errors';
import {demoKbArticles, isLocalDemo} from '@/lib/demo-data';

const PATCH_FIELDS = ['title', 'content', 'category', 'status', 'tags'] as const;

export async function GET(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    if (isLocalDemo()) {
      const demo = demoKbArticles.find((a) => a.id === id);
      return demo ? NextResponse.json(demo) : NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    }
    const u = await requireUser('kb:read');
    const existing = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    const article = await prisma.kBArticle.update({where: {id}, data: {views: {increment: 1}}});
    return NextResponse.json(article);
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function PATCH(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('kb:write');
    const existing = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    const parsed = kbArticleSchema.partial().parse(await req.json());
    const data: Record<string, unknown> = {};
    for (const key of PATCH_FIELDS) if (key in parsed) data[key] = (parsed as any)[key];
    const article = await prisma.kBArticle.update({where: {id}, data});
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'UPDATE', entityType: 'KBArticle', entityId: id, newValue: data as Prisma.InputJsonObject}});
    return NextResponse.json(article);
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}

export async function DELETE(_: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const u = await requireUser('kb:write');
    const existing = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    await prisma.$transaction([
      prisma.kBArticle.delete({where: {id}}),
      prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'DELETE', entityType: 'KBArticle', entityId: id, oldValue: {title: existing.title}}}),
    ]);
    return NextResponse.json({ok: true});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
