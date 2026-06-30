'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation} from '@tanstack/react-query';
import {ArrowLeft, Eye, Pencil, ThumbsDown, ThumbsUp, Trash2} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/toast';
import type {KBArticle} from './KnowledgeBase';

export function KBArticleView({initial}: {initial: KBArticle}) {
  const router = useRouter();
  const {toast} = useToast();
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const canWrite = role === 'ADMIN' || role === 'AGENT';

  const [counts, setCounts] = useState({yes: initial.helpfulYes, no: initial.helpfulNo});
  const [voted, setVoted] = useState(false);

  const vote = useMutation({
    mutationFn: (helpful: boolean) => apiSend<{helpfulYes: number; helpfulNo: number}>(`/api/kb/${initial.id}/vote`, 'POST', {helpful}),
    onSuccess: (res, helpful) => {
      setVoted(true);
      if (typeof res?.helpfulYes === 'number') setCounts({yes: res.helpfulYes, no: res.helpfulNo});
      else setCounts((c) => ({yes: c.yes + (helpful ? 1 : 0), no: c.no + (helpful ? 0 : 1)}));
      toast({tone: 'success', title: 'Thanks for your feedback'});
    },
    onError: (err) => toast({tone: 'error', title: 'Vote failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const remove = useMutation({
    mutationFn: () => apiSend(`/api/kb/${initial.id}`, 'DELETE'),
    onSuccess: () => {
      toast({tone: 'success', title: 'Article deleted'});
      router.push('/kb');
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Delete failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/kb')}>
          <ArrowLeft className="h-4 w-4" /> Knowledge Base
        </Button>
        {canWrite && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/kb/${initial.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={remove.isPending}
              onClick={() => {
                if (window.confirm('Delete this article? This cannot be undone.')) remove.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{initial.category}</Badge>
          {initial.status === 'draft' && <Badge tone="warning">Draft</Badge>}
          {initial.tags?.map((t) => (
            <Badge key={t} tone="neutral">
              #{t}
            </Badge>
          ))}
        </div>
        <h1 className="mt-3 text-3xl font-bold">{initial.title}</h1>
        <p className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {initial.views} views
          </span>
          <span>Updated {new Date(initial.updatedAt).toLocaleDateString()}</span>
        </p>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: initial.content}} />
      </Card>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <span className="text-sm font-semibold">Was this helpful?</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={voted || vote.isPending} onClick={() => vote.mutate(true)}>
            <ThumbsUp className="h-4 w-4" /> Yes · {counts.yes}
          </Button>
          <Button variant="outline" size="sm" disabled={voted || vote.isPending} onClick={() => vote.mutate(false)}>
            <ThumbsDown className="h-4 w-4" /> No · {counts.no}
          </Button>
        </div>
        {voted && <span className="text-sm text-muted-foreground">Thanks for your feedback.</span>}
      </Card>
    </div>
  );
}
