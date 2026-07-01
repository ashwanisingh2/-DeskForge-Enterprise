import {Shell} from '@/components/Shell';
import {Dashboard} from '@/components/Dashboard';
import {demoDashboard} from '@/lib/demo-data';

export default function Page() {
  return (
    <Shell>
      <Dashboard initial={demoDashboard as never} />
    </Shell>
  );
}
