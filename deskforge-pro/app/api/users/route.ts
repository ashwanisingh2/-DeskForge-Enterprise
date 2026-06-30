import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {isLocalDemo} from '@/lib/demo-data';

const demoAgents = [
  {id: 'local-demo-admin', name: 'Ashwani Sharma', role: 'ADMIN'},
  {id: 'demo-agent-1', name: 'Priya Mehta', role: 'AGENT'},
  {id: 'demo-agent-2', name: 'Ravi Kumar', role: 'AGENT'},
];

/** Assignable users (agents and admins) for assignment pickers and filters. */
export async function GET() {
  try {
    if (isLocalDemo()) return NextResponse.json({users: demoAgents});
    const u = await requireUser('ticket:read:any');
    const users = await prisma.user.findMany({
      where: {tenantId: u.tenantId, isActive: true, role: {in: ['AGENT', 'ADMIN']}},
      select: {id: true, name: true, role: true},
      orderBy: {name: 'asc'},
    });
    return NextResponse.json({users});
  } catch (e: any) {
    const status = e?.message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json({error: {code: e?.message || 'UNAUTHORIZED', message: 'Unauthorized'}}, {status});
  }
}
