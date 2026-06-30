'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CheckCircle2, PlayCircle, Send, XCircle} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {changeStatusTone, humanize, riskTone} from './change-options';

type Approval = {id: string; approverId: string; approverRole: string; status: string; comment?: string | null; decidedAt?: string | null};
type Change = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  risk: string;
  implementationPlan: string;
  rollbackPlan: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  pirSuccess?: boolean | null;
  actualDuration?: number | null;
  pirIssues?: string | null;
  lessonsLearned?: string | null;
  requester?: {name: string} | null;
  approvals?: Approval[];
};

export function ChangeDetail({initial}: {initial: Change}) {
  const router = useRouter();
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const canManage = ['ADMIN', 'AGENT'].includes((useSession().data?.user as {role?: string} | undefined)?.role ?? '');

  const {data: change = initial} = useQuery({
    queryKey: ['change', initial.id],
    queryFn: () => apiGet<Change>(`/api/changes/${initial.id}`),
    initialData: initial,
    staleTime: 0,
  });

  const [review, setReview] = useState({success: true, actualDuration: '', issues: '', lessonsLearned: '', close: false});
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['change', initial.id]});

  const action = useMutation({
    mutationFn: ({url, body}: {url: string; body?: unknown}) => apiSend(`/api/changes/${initial.id}${url}`, 'POST', body),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Change updated'});
    },
    onError: (err) => toast({tone: 'error', title: 'Action failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const transition = useMutation({
    mutationFn: (status: string) => apiSend(`/api/changes/${initial.id}`, 'PATCH', {status}),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Status updated'});
    },
    onError: (err) => toast({tone: 'error', title: 'Transition failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const inApproval = ['SUBMITTED', 'CAB_REVIEW'].includes(change.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/changes')}>
          <ArrowLeft className="h-4 w-4" /> Changes
        </Button>
        <span className="font-mono font-bold text-primary">{change.id}</span>
        <h1 className="text-2xl font-bold">{change.title}</h1>
        <Badge tone={changeStatusTone[change.status] ?? 'neutral'}>{humanize(change.status)}</Badge>
        <Badge tone={riskTone[change.risk] ?? 'neutral'}>{change.risk} risk</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-2 font-bold">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: change.description}} />
          </Card>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-2 font-bold">Implementation plan</h3>
              <p className="whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: change.implementationPlan}} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-2 font-bold">Rollback plan</h3>
              <p className="whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: change.rollbackPlan}} />
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-3 font-bold">Approvals</h3>
            {(change.approvals?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No approvers assigned.</p>
            ) : (
              <ul className="divide-y divide-border">
                {change.approvals!.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="font-medium">{humanize(a.approverRole)}</span>
                    <Badge tone={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'danger' : 'warning'} className="ml-auto">
                      {humanize(a.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {canManage && inApproval && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" loading={action.isPending} onClick={() => action.mutate({url: '/approve', body: {decision: 'APPROVED'}})}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
                <Button size="sm" variant="destructive" loading={action.isPending} onClick={() => action.mutate({url: '/approve', body: {decision: 'REJECTED'}})}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          </Card>

          {change.status === 'IMPLEMENTED' && canManage && (
            <Card className="p-5">
              <h3 className="mb-3 font-bold">Post-implementation review</h3>
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  action.mutate({url: '/review', body: {success: review.success, actualDuration: Number(review.actualDuration) || 1, issues: review.issues || undefined, lessonsLearned: review.lessonsLearned || undefined, close: review.close}});
                }}
              >
                <label className="text-sm">
                  <span className="font-semibold">Outcome</span>
                  <select className="input mt-1" value={review.success ? 'yes' : 'no'} onChange={(e) => setReview({...review, success: e.target.value === 'yes'})}>
                    <option value="yes">Successful</option>
                    <option value="no">Failed</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-semibold">Actual duration (min)</span>
                  <Input type="number" min={1} className="mt-1" value={review.actualDuration} onChange={(e) => setReview({...review, actualDuration: e.target.value})} required />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="font-semibold">Issues</span>
                  <Textarea className="mt-1 min-h-16" value={review.issues} onChange={(e) => setReview({...review, issues: e.target.value})} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="font-semibold">Lessons learned</span>
                  <Textarea className="mt-1 min-h-16" value={review.lessonsLearned} onChange={(e) => setReview({...review, lessonsLearned: e.target.value})} />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={review.close} onChange={(e) => setReview({...review, close: e.target.checked})} />
                  Close change after review
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit" size="sm" loading={action.isPending}>
                    Submit review
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {change.pirSuccess !== null && change.pirSuccess !== undefined && (
            <Card className="p-5">
              <h3 className="mb-2 font-bold">Review outcome</h3>
              <p className="text-sm">
                Result: <b>{change.pirSuccess ? 'Successful' : 'Failed'}</b> · Duration: {change.actualDuration ?? '—'} min
              </p>
              {change.lessonsLearned && <p className="mt-2 text-sm text-muted-foreground">Lessons: {change.lessonsLearned}</p>}
            </Card>
          )}
        </section>

        <aside>
          <Card className="sticky top-20 space-y-3 p-5">
            <h3 className="font-bold">Details</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Type" value={humanize(change.type)} />
              <Row label="Requester" value={change.requester?.name ?? '—'} />
              <Row label="Window start" value={change.windowStart ? new Date(change.windowStart).toLocaleString() : '—'} />
              <Row label="Window end" value={change.windowEnd ? new Date(change.windowEnd).toLocaleString() : '—'} />
            </dl>

            {canManage && (
              <div className="space-y-2 border-t border-border pt-3">
                {change.status === 'DRAFT' && (
                  <Button size="sm" className="w-full" loading={transition.isPending} onClick={() => transition.mutate('SUBMITTED')}>
                    <Send className="h-4 w-4" /> Submit for approval
                  </Button>
                )}
                {change.status === 'APPROVED' && (
                  <Button size="sm" className="w-full" loading={action.isPending} onClick={() => action.mutate({url: '/implement'})}>
                    <PlayCircle className="h-4 w-4" /> Mark implemented
                  </Button>
                )}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}
