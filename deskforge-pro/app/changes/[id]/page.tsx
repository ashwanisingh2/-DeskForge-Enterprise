import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {ChangeDetail} from '@/components/changes/ChangeDetail';
import {requireUser} from '@/lib/session';
import {demoChangeRecords, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoChangeRecords.find((c) => c.id === id);
    if (!demo) notFound();
    return <Shell><ChangeDetail initial={demo as never} /></Shell>;
  }

  const u = await requireUser('change:manage');
  const change = await prisma.changeRequest.findFirst({where: {id, tenantId: u.tenantId}, include: {requester: true, approvals: true}});
  if (!change) notFound();

  const serialized = {
    ...change,
    windowStart: change.windowStart?.toISOString() ?? null,
    windowEnd: change.windowEnd?.toISOString() ?? null,
    createdAt: change.createdAt.toISOString(),
    updatedAt: change.updatedAt.toISOString(),
    approvals: change.approvals.map((a) => ({...a, decidedAt: a.decidedAt?.toISOString() ?? null, createdAt: a.createdAt.toISOString()})),
  };

  return (
    <Shell>
      <ChangeDetail initial={serialized as never} />
    </Shell>
  );
}
