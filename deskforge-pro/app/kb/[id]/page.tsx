import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {KBArticleView} from '@/components/kb/KBArticleView';
import {requireUser} from '@/lib/session';
import {demoKbArticles, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoKbArticles.find((a) => a.id === id);
    if (!demo) notFound();
    return <Shell><KBArticleView initial={demo as never} /></Shell>;
  }

  const u = await requireUser('kb:read');
  const existing = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}});
  if (!existing) notFound();
  const article = await prisma.kBArticle.update({where: {id}, data: {views: {increment: 1}}});

  return (
    <Shell>
      <KBArticleView initial={{...article, updatedAt: article.updatedAt.toISOString()} as never} />
    </Shell>
  );
}
