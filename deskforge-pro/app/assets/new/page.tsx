import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {AssetEditor} from '@/components/assets/AssetEditor';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!isLocalDemo()) {
    const u = await requireUser();
    if (!can(u.role, 'asset:admin')) redirect('/assets');
  }
  return (
    <Shell>
      <AssetEditor />
    </Shell>
  );
}
