import {notFound, redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {KBEditor} from '@/components/kb/KBEditor';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {demoKbArticles, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoKbArticles.find((a) => a.id === id);
    if (!demo) notFound();
    return <Shell><KBEditor initial={demo as never} /></Shell>;
  }

  const u = await requireUser('kb:read');
  if (!can(u.role, 'kb:write')) redirect(`/kb/${id}`);
  const article = await prisma.kBArticle.findFirst({where: {id, tenantId: u.tenantId}});
  if (!article) notFound();

  return (
    <Shell>
      <KBEditor initial={{...article, updatedAt: article.updatedAt.toISOString()} as never} />
    </Shell>
  );
}
