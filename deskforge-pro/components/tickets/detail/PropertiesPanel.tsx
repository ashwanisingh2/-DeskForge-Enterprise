'use client';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Select} from '@/components/ui/input';
import {SlaBadge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/toast';
import {humanize, PRIORITY_OPTIONS} from '@/components/tickets/ticket-options';

type Ticket = {
  id: string;
  status: string;
  priority: string;
  category: string;
  dueDate?: string | null;
  slaStatus?: string;
  allowedTransitions?: string[];
  requester?: {name: string} | null;
  assignee?: {id: string; name: string} | null;
};

export function PropertiesPanel({ticket, canManage}: {ticket: Ticket; canManage: boolean}) {
  const {toast} = useToast();
  const queryClient = useQueryClient();

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiGet<{users: {id: string; name: string}[]}>('/api/users'),
    enabled: canManage,
    staleTime: 5 * 60_000,
  });
  const agents = agentsQuery.data?.users ?? [];

  const patch = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiSend(`/api/tickets/${ticket.id}`, 'PATCH', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['ticket', ticket.id]});
      queryClient.invalidateQueries({queryKey: ['tickets']});
      toast({tone: 'success', title: 'Ticket updated'});
    },
    onError: (err) => toast({tone: 'error', title: 'Update failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const onHold = ['PENDING_CUSTOMER', 'ON_HOLD'].includes(ticket.status);
  const statusOptions = Array.from(new Set([ticket.status, ...(ticket.allowedTransitions ?? [])]));

  return (
    <div className="space-y-4">
      {onHold && <p className="rounded-lg bg-amber-500/15 p-2 text-sm font-semibold text-amber-600 dark:text-amber-300">SLA clock paused</p>}

      <Field label="Status">
        {canManage ? (
          <Select value={ticket.status} disabled={patch.isPending} onChange={(e) => patch.mutate({status: e.target.value})}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm font-medium">{humanize(ticket.status)}</p>
        )}
      </Field>

      <Field label="Priority">
        {canManage ? (
          <Select value={ticket.priority} disabled={patch.isPending} onChange={(e) => patch.mutate({priority: e.target.value})}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {humanize(p)}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm font-medium">{humanize(ticket.priority)}</p>
        )}
      </Field>

      <Field label="Assignee">
        {canManage ? (
          <Select
            value={ticket.assignee?.id ?? ''}
            disabled={patch.isPending}
            onChange={(e) => patch.mutate({assigneeId: e.target.value || null})}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm font-medium">{ticket.assignee?.name ?? 'Unassigned'}</p>
        )}
      </Field>

      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        <Row label="Requester" value={ticket.requester?.name ?? '—'} />
        <Row label="Category" value={ticket.category} />
        <Row label="Due" value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : '—'} />
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">SLA</dt>
          <dd>{ticket.slaStatus ? <SlaBadge value={ticket.slaStatus as any} /> : '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
