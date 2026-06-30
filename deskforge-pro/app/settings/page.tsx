import {redirect} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {SlaEditor} from '@/components/settings/SlaEditor';
import {BusinessHoursEditor} from '@/components/settings/BusinessHoursEditor';
import {HolidaysEditor} from '@/components/settings/HolidaysEditor';
import {CannedResponsesEditor} from '@/components/settings/CannedResponsesEditor';
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
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mb-6 text-muted-foreground">Configure SLA policy, business hours, holidays and team responses.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        <SlaEditor />
        <BusinessHoursEditor />
        <HolidaysEditor />
        <CannedResponsesEditor />
      </div>
    </Shell>
  );
}
