import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {KBEditor} from '@/components/kb/KBEditor';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!isLocalDemo()) {
    const u = await requireUser();
    if (!can(u.role, 'kb:write')) redirect('/kb');
  }
  return (
    <Shell>
      <KBEditor />
    </Shell>
  );
}
