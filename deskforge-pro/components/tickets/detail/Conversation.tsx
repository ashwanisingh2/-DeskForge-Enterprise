'use client';
import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Lock, Send} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Avatar} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {cn} from '@/lib/utils';

type Comment = {id: string; content: string; isInternal: boolean; createdAt: string; author: {name: string}};

export function Conversation({ticketId, comments, canInternal}: {ticketId: string; comments: Comment[]; canInternal: boolean}) {
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const {toast} = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiSend(`/api/tickets/${ticketId}/comments`, 'POST', {content: text, isInternal: internal}),
    onSuccess: () => {
      setText('');
      setInternal(false);
      queryClient.invalidateQueries({queryKey: ['ticket', ticketId]});
      toast({tone: 'success', title: 'Reply posted'});
    },
    onError: (err) => toast({tone: 'error', title: 'Could not post', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="space-y-3">
      {comments.length === 0 && <p className="px-1 text-sm text-muted-foreground">No replies yet.</p>}
      {comments.map((c) => (
        <div
          key={c.id}
          className={cn('rounded-xl border p-4', c.isInternal ? 'border-amber-300/60 bg-amber-500/10' : 'border-border bg-card')}
        >
          <div className="flex items-center gap-2">
            <Avatar name={c.author.name} className="h-7 w-7 text-xs" />
            <b className="text-sm">{c.author.name}</b>
            {c.isInternal && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                <Lock className="h-3 w-3" /> Internal note
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6" dangerouslySetInnerHTML={{__html: c.content}} />
        </div>
      ))}

      <form
        className="rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) mutation.mutate();
        }}
      >
        <Textarea
          className="min-h-24"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={internal ? 'Write an internal note (not visible to requester)…' : 'Write a reply…'}
        />
        <div className="mt-3 flex items-center gap-3">
          {canInternal && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Internal note
            </label>
          )}
          <Button type="submit" size="sm" className="ml-auto" loading={mutation.isPending} disabled={!text.trim()}>
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </div>
  );
}
