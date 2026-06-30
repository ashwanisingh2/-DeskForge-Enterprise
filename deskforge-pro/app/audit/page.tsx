import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {AuditLog} from '@/components/audit/AuditLog';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!isLocalDemo()) {
    const u = await requireUser();
    if (!can(u.role, 'settings:admin')) redirect('/dashboard');
  }
  return (
    <Shell>
      <AuditLog />
    </Shell>
  );
}
