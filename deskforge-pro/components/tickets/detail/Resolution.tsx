'use client';
import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {CheckCircle2, Save} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

type Props = {
  ticketId: string;
  resolutionNote?: string | null;
  status: string;
  allowedTransitions?: string[];
  canManage: boolean;
};

export function Resolution({ticketId, resolutionNote, status, allowedTransitions = [], canManage}: Props) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState(resolutionNote ?? '');

  const invalidate = () => queryClient.invalidateQueries({queryKey: ['ticket', ticketId]});

  const save = useMutation({
    mutationFn: (resolve: boolean) => apiSend(`/api/tickets/${ticketId}`, 'PATCH', {resolutionNote: note, ...(resolve ? {status: 'RESOLVED'} : {})}),
    onSuccess: (_r, resolve) => {
      invalidate();
      queryClient.invalidateQueries({queryKey: ['tickets']});
      toast({tone: 'success', title: resolve ? 'Ticket resolved' : 'Resolution saved'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const canResolve = canManage && allowedTransitions.includes('RESOLVED');
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  if (!canManage) {
    return resolutionNote ? (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-1 text-sm font-semibold">Resolution</p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{resolutionNote}</p>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">This ticket has not been resolved yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {isResolved && (
        <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> This ticket is {status.toLowerCase()}
        </p>
      )}
      <label className="block text-sm">
        <span className="font-semibold">Resolution notes</span>
        <Textarea
          className="mt-1 min-h-40"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the root cause and how the issue was resolved for the requester and knowledge base…"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" loading={save.isPending} disabled={!note.trim()} onClick={() => save.mutate(false)}>
          <Save className="h-4 w-4" /> Save resolution
        </Button>
        {canResolve && (
          <Button size="sm" loading={save.isPending} disabled={!note.trim()} onClick={() => save.mutate(true)}>
            <CheckCircle2 className="h-4 w-4" /> Save & resolve
          </Button>
        )}
      </div>
    </div>
  );
}
