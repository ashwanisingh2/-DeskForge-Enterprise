import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {SecuritySettings} from '@/components/settings/SecuritySettings';
import {requireUser} from '@/lib/session';
import {isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!isLocalDemo()) await requireUser();
  return (
    <Shell>
      <SecuritySettings />
    </Shell>
  );
}
