'use client';
import Link from 'next/link';
import {useQuery} from '@tanstack/react-query';
import {Mail, Ticket as TicketIcon} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Avatar} from '@/components/ui/tabs';
import {StatusBadge} from '@/components/ui/badge';

type Requester = {id?: string; name?: string; email?: string} | null;
type TicketRow = {id: string; title: string; status: any};

export function RequesterCard({requester, currentTicketId}: {requester: Requester; currentTicketId: string}) {
  const requesterId = requester?.id;

  const {data} = useQuery({
    queryKey: ['requester-tickets', requesterId],
    queryFn: () => apiGet<{tickets: TicketRow[]}>(`/api/tickets?requesterId=${requesterId}&limit=6`),
    enabled: Boolean(requesterId),
    staleTime: 60_000,
  });

  const previous = (data?.tickets ?? []).filter((t) => t.id !== currentTicketId).slice(0, 5);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-bold">Requester</h3>
      <div className="flex items-center gap-3">
        <Avatar name={requester?.name ?? '?'} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{requester?.name ?? '—'}</p>
          {requester?.email && (
            <a href={`mailto:${requester.email}`} className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary">
              <Mail className="h-3 w-3" /> {requester.email}
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TicketIcon className="h-3.5 w-3.5" /> Previous requests
        </p>
        {previous.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other tickets from this requester.</p>
        ) : (
          <ul className="space-y-1.5">
            {previous.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <span className="font-mono text-xs text-primary">{t.id}</span>
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <StatusBadge value={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
