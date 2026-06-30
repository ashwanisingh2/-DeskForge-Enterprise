import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {kbVoteSchema} from '@/lib/validations';
import {structuredError} from '@/lib/api-errors';
import {isLocalDemo} from '@/lib/demo-data';

export async function POST(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  try {
    const {helpful} = kbVoteSchema.parse(await req.json());
    if (isLocalDemo()) return NextResponse.json({ok: true, helpful});
    const u = await requireUser('kb:read');
    const existing = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}, select: {id: true}});
    if (!existing) return NextResponse.json({error: {code: 'NOT_FOUND', message: 'Not found'}}, {status: 404});
    const article = await prisma.kBArticle.update({
      where: {id},
      data: helpful ? {helpfulYes: {increment: 1}} : {helpfulNo: {increment: 1}},
      select: {helpfulYes: true, helpfulNo: true},
    });
    return NextResponse.json(article);
  } catch (e: any) {
    return NextResponse.json(structuredError(e), {status: e?.message === 'FORBIDDEN' ? 403 : 400});
  }
}
