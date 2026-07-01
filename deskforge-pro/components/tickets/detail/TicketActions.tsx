'use client';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useSession} from 'next-auth/react';
import {CheckCircle2, Link2, Lock, Printer, RotateCcw, UserPlus} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {useToast} from '@/components/ui/toast';

type Ticket = {id: string; status: string; assignee?: {id: string; name: string} | null; allowedTransitions?: string[]};

/** One-click ticket action toolbar (Pick Up, Resolve, Close, Reopen, Print, Share). */
export function TicketActions({ticket, canManage}: {ticket: Ticket; canManage: boolean}) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const userId = (useSession().data?.user as {id?: string} | undefined)?.id;

  const allowed = ticket.allowedTransitions ?? [];

  const patch = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiSend(`/api/tickets/${ticket.id}`, 'PATCH', payload),
    onSuccess: (_res, payload) => {
      queryClient.invalidateQueries({queryKey: ['ticket', ticket.id]});
      queryClient.invalidateQueries({queryKey: ['tickets']});
      const label = 'status' in payload ? `Ticket ${String(payload.status).replace(/_/g, ' ').toLowerCase()}` : 'Ticket updated';
      toast({tone: 'success', title: label});
    },
    onError: (err) => toast({tone: 'error', title: 'Action failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      toast({tone: 'success', title: 'Link copied to clipboard'});
    } catch {
      toast({tone: 'error', title: 'Could not copy link'});
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && !ticket.assignee && (
        <Button size="sm" variant="outline" loading={patch.isPending} onClick={() => patch.mutate({assigneeId: userId})}>
          <UserPlus className="h-4 w-4" /> Pick up
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

      <Button size="sm" variant="ghost" onClick={share} aria-label="Share ticket link">
        <Link2 className="h-4 w-4" /> Share
      </Button>
      <Button size="sm" variant="ghost" onClick={() => window.print()} aria-label="Print ticket">
        <Printer className="h-4 w-4" /> Print
      </Button>
    </div>
  );
}
