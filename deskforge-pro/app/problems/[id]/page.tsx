import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {ProblemDetail} from '@/components/problems/ProblemDetail';
import {requireUser} from '@/lib/session';
import {demoProblemRecords, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoProblemRecords.find((p) => p.id === id);
    if (!demo) notFound();
    return <Shell><ProblemDetail initial={demo as never} /></Shell>;
  }

  const u = await requireUser('problem:manage');
  const problem = await prisma.problem.findFirst({
    where: {id, tenantId: u.tenantId},
    include: {owner: {select: {id: true, name: true}}, incidents: {include: {ticket: {select: {id: true, title: true, status: true}}}}},
  });
  if (!problem) notFound();

  return (
    <Shell>
      <ProblemDetail initial={problem as never} />
    </Shell>
  );
}
