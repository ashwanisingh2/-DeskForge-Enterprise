import {redirect} from 'next/navigation';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {Dashboard} from '@/components/Dashboard';
import {computeDashboard} from '@/lib/analytics';
import {demoDashboard, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const tenantId = (session.user as {tenantId?: string}).tenantId;
  if (!tenantId) redirect('/login');

  if (isLocalDemo()) return <Shell><Dashboard initial={demoDashboard as never} /></Shell>;

  const tickets = await prisma.ticket.findMany({
    where: {deletedAt: null, tenantId},
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      dueDate: true,
      slaStatus: true,
      requester: {select: {name: true}},
    },
  });

  return <Shell><Dashboard initial={computeDashboard(tickets)} /></Shell>;
}
