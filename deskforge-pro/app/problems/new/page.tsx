import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {ProblemEditor} from '@/components/problems/ProblemEditor';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!isLocalDemo()) {
    const u = await requireUser();
    if (!can(u.role, 'problem:manage')) redirect('/problems');
  }
  return (
    <Shell>
      <ProblemEditor />
    </Shell>
  );
}
