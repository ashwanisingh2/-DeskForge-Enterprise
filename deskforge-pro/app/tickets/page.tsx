import {Shell} from '@/components/Shell';
import {TicketList} from '@/components/TicketList';

export default function Page() {
  return (
    <Shell>
      <h1 className="text-3xl font-bold">Tickets</h1>
      <p className="mb-6 text-muted-foreground">Track, triage and resolve every request.</p>
      <TicketList />
    </Shell>
  );
}
