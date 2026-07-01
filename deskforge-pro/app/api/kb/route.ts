import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {kbArticleSchema} from '@/lib/validations';
import {structuredError} from '@/lib/api-errors';
import {demoKbArticles, isLocalDemo} from '@/lib/demo-data';

export async function GET(req: NextRequest) {
  try {
    if (isLocalDemo()) return NextResponse.json({articles: demoKbArticles, total: demoKbArticles.length, page: 1, totalPages: 1});
    const u = await requireUser('kb:read');
    const q = req.nextUrl.searchParams;
    const page = Math.max(1, +(q.get('page') || 1));
    const limit = Math.min(60, Math.max(1, +(q.get('limit') || 24)));
    const where: any = {tenantId: u.tenantId};
    const category = q.get('category');
    if (category) where.category = category;
    const status = q.get('status');
    if (status) where.status = status;
    const search = q.get('search')?.trim();
    if (search) where.OR = [{title: {contains: search, mode: 'insensitive'}}, {content: {contains: search, mode: 'insensitive'}}];

    const [articles, total] = await prisma.$transaction([
      prisma.kBArticle.findMany({
        where,
        select: {id: true, title: true, category: true, status: true, views: true, helpfulYes: true, helpfulNo: true, tags: true, content: true, updatedAt: true},
        orderBy: {updatedAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kBArticle.count({where}),
    ]);
    return NextResponse.json({articles, total, page, totalPages: Math.max(1, Math.ceil(total / limit))});
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 401});
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser('kb:write');
    const data = kbArticleSchema.parse(await req.json());
    const article = await prisma.kBArticle.create({data: {...data, authorId: u.id, tenantId: u.tenantId}});
    await prisma.auditLog.create({data: {tenantId: u.tenantId, userId: u.id, action: 'CREATE', entityType: 'KBArticle', entityId: article.id, newValue: {title: data.title, category: data.category}}});
    return NextResponse.json(article, {status: 201});
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : e?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(structuredError(e), {status});
  }
}
