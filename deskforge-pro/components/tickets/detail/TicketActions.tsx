'use client';
import {useRouter} from 'next/navigation';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useSession} from 'next-auth/react';
import {ArrowUpCircle, CheckCircle2, Copy, GitMerge, Link2, Lock, Printer, RotateCcw, Trash2, UserPlus} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {useToast} from '@/components/ui/toast';

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignee?: {id: string; name: string} | null;
  allowedTransitions?: string[];
};

const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function TicketActions({ticket, canManage}: {ticket: Ticket; canManage: boolean}) {
  const router = useRouter();
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const session = useSession().data;
  const userId = (session?.user as {id?: string} | undefined)?.id;
  const isAdmin = (session?.user as {role?: string} | undefined)?.role === 'ADMIN';

  const allowed = ticket.allowedTransitions ?? [];
  const nextPriority = PRIORITY_ORDER[Math.min(PRIORITY_ORDER.indexOf(ticket.priority as never) + 1, PRIORITY_ORDER.length - 1)];
  const canEscalate = canManage && nextPriority !== ticket.priority;

  const refresh = () => {
    queryClient.invalidateQueries({queryKey: ['ticket', ticket.id]});
    queryClient.invalidateQueries({queryKey: ['tickets']});
  };

  const patch = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiSend(`/api/tickets/${ticket.id}`, 'PATCH', payload),
    onSuccess: (_r, payload) => {
      refresh();
      toast({tone: 'success', title: 'status' in payload ? `Ticket ${String(payload.status).replace(/_/g, ' ').toLowerCase()}` : 'Ticket updated'});
    },
    onError: (err) => toast({tone: 'error', title: 'Action failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const clone = useMutation({
    mutationFn: () =>
      apiSend<{id: string}>('/api/tickets', 'POST', {
        title: `Clone of ${ticket.title}`.slice(0, 150),
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        source: 'CLONE',
      }),
    onSuccess: (t) => {
      toast({tone: 'success', title: `Cloned to ${t.id}`});
      router.push(`/tickets/${t.id}`);
    },
    onError: (err) => toast({tone: 'error', title: 'Clone failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const merge = useMutation({
    mutationFn: (targetId: string) => apiSend<{targetId: string}>(`/api/tickets/${ticket.id}/merge`, 'POST', {targetId}),
    onSuccess: (res) => {
      toast({tone: 'success', title: `Merged into ${res.targetId}`});
      router.push(`/tickets/${res.targetId}`);
    },
    onError: (err) => toast({tone: 'error', title: 'Merge failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const remove = useMutation({
    mutationFn: () => apiSend(`/api/tickets/${ticket.id}`, 'DELETE'),
    onSuccess: () => {
      toast({tone: 'success', title: 'Ticket deleted'});
      router.push('/tickets');
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Delete failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({tone: 'success', title: 'Link copied to clipboard'});
    } catch {
      toast({tone: 'error', title: 'Could not copy link'});
    }
  };

  const doMerge = () => {
    const target = window.prompt('Merge this ticket into (target ticket ID, e.g. TKT-0002):');
    if (target && /^TKT-\d{4,}$/i.test(target.trim())) merge.mutate(target.trim().toUpperCase());
    else if (target) toast({tone: 'error', title: 'Invalid ticket ID', description: 'Use format TKT-0001'});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && !ticket.assignee && (
        <Button size="sm" variant="outline" loading={patch.isPending} onClick={() => patch.mutate({assigneeId: userId})}>
          <UserPlus className="h-4 w-4" /> Pick up
        </Button>
      )}

      {canEscalate && (
        <Button size="sm" variant="outline" loading={patch.isPending} onClick={() => patch.mutate({priority: nextPriority})}>
          <ArrowUpCircle className="h-4 w-4" /> Escalate
        </Button>
      )}

      {canManage && allowed.includes('RESOLVED') && (
        <Button size="sm" loading={patch.isPending} onClick={() => patch.mutate({status: 'RESOLVED'})}>
          <CheckCircle2 className="h-4 w-4" /> Resolve
        </Button>
      )}

      {allowed.includes('CLOSED') && (
        <Button size="sm" variant="secondary" loading={patch.isPending} onClick={() => patch.mutate({status: 'CLOSED'})}>
          <Lock className="h-4 w-4" /> Close
        </Button>
      )}

      {allowed.includes('OPEN') && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
        <Button size="sm" variant="outline" loading={patch.isPending} onClick={() => patch.mutate({status: 'OPEN'})}>
          <RotateCcw className="h-4 w-4" /> Reopen
        </Button>
      )}

      {canManage && (
        <Button size="sm" variant="ghost" loading={merge.isPending} onClick={doMerge}>
          <GitMerge className="h-4 w-4" /> Merge
        </Button>
      )}

      {canManage && (
        <Button size="sm" variant="ghost" loading={clone.isPending} onClick={() => clone.mutate()}>
          <Copy className="h-4 w-4" /> Clone
        </Button>
      )}

      <Button size="sm" variant="ghost" onClick={share} aria-label="Share ticket link">
        <Link2 className="h-4 w-4" /> Share
      </Button>
      <Button size="sm" variant="ghost" onClick={() => window.print()} aria-label="Print ticket">
        <Printer className="h-4 w-4" /> Print
      </Button>

      {isAdmin && (
        <Button
          size="sm"
          variant="ghost"
          loading={remove.isPending}
          onClick={() => window.confirm('Delete this ticket? It can be restored by an administrator.') && remove.mutate()}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      )}
    </div>
  );
}
