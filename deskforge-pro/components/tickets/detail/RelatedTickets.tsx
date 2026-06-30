'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {GitMerge, Link2, Trash2} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {Input, Select} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

const RELATIONSHIPS = ['RELATED', 'PARENT_CHILD', 'DUPLICATE', 'BLOCKS', 'DEPENDS_ON', 'CAUSED_BY'] as const;
const TICKET_RE = /^TKT-\d{4,}$/;
const humanize = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Relation = {id: string; relationship: string; ticketB?: {id: string; title: string}; ticketA?: {id: string; title: string}};

type Props = {
  ticketId: string;
  relatedTo: Relation[];
  relatedFrom: Relation[];
  canManage: boolean;
};

export function RelatedTickets({ticketId, relatedTo, relatedFrom, canManage}: Props) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState('');
  const [relationship, setRelationship] = useState<string>('RELATED');
  const [mergeTarget, setMergeTarget] = useState('');

  const invalidate = () => queryClient.invalidateQueries({queryKey: ['ticket', ticketId]});

  const linkMutation = useMutation({
    mutationFn: () => apiSend(`/api/tickets/${ticketId}/links`, 'POST', {targetId: targetId.toUpperCase(), relationship}),
    onSuccess: () => {
      setTargetId('');
      invalidate();
      toast({tone: 'success', title: 'Tickets linked'});
    },
    onError: (err) => toast({tone: 'error', title: 'Link failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => apiSend(`/api/tickets/${ticketId}/links?linkId=${linkId}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Link removed'});
    },
    onError: (err) => toast({tone: 'error', title: 'Could not remove', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const mergeMutation = useMutation({
    mutationFn: () => apiSend(`/api/tickets/${ticketId}/merge`, 'POST', {targetId: mergeTarget.toUpperCase()}),
    onSuccess: () => {
      setMergeTarget('');
      invalidate();
      toast({tone: 'success', title: 'Ticket merged', description: 'This ticket was closed as duplicate.'});
    },
    onError: (err) => toast({tone: 'error', title: 'Merge failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const renderRelation = (rel: Relation, target: {id: string; title: string} | undefined, deletable: boolean) =>
    target ? (
      <li key={rel.id} className="flex items-center gap-3 p-3">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{humanize(rel.relationship)}</span>
        <Link href={`/tickets/${target.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
          <span className="font-mono text-primary">{target.id}</span> · {target.title}
        </Link>
        {canManage && deletable && (
          <button onClick={() => unlinkMutation.mutate(rel.id)} aria-label="Remove link" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </li>
    ) : null;

  const hasRelations = relatedTo.length > 0 || relatedFrom.length > 0;

  return (
    <div className="space-y-4">
      {hasRelations ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {relatedTo.map((r) => renderRelation(r, r.ticketB, true))}
          {relatedFrom.map((r) => renderRelation(r, r.ticketA, false))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No related tickets.</p>
      )}

      {canManage && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            className="space-y-2 rounded-xl border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (TICKET_RE.test(targetId.toUpperCase())) linkMutation.mutate();
              else toast({tone: 'error', title: 'Invalid ticket ID', description: 'Use format TKT-0001'});
            }}
          >
            <p className="text-sm font-semibold">Link a ticket</p>
            <Input placeholder="TKT-0001" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            <Select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {humanize(r)}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="outline" loading={linkMutation.isPending}>
              <Link2 className="h-4 w-4" /> Link
            </Button>
          </form>

          <form
            className="space-y-2 rounded-xl border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!TICKET_RE.test(mergeTarget.toUpperCase())) {
                toast({tone: 'error', title: 'Invalid ticket ID', description: 'Use format TKT-0001'});
                return;
              }
              if (window.confirm(`Merge ${ticketId} into ${mergeTarget.toUpperCase()}? This ticket will be closed as a duplicate.`)) mergeMutation.mutate();
            }}
          >
            <p className="text-sm font-semibold">Merge into</p>
            <Input placeholder="TKT-0001" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} />
            <p className="text-xs text-muted-foreground">Closes this ticket and links it as a duplicate of the target.</p>
            <Button type="submit" size="sm" variant="destructive" loading={mergeMutation.isPending}>
              <GitMerge className="h-4 w-4" /> Merge
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
