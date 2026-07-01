'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, Link2, Plus, Trash2} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {humanize, problemStatusTone} from './problem-options';

type Incident = {ticketId: string; ticket?: {id: string; title: string; status: string}};
type Problem = {
  id: string;
  title: string;
  description: string;
  status: string;
  rootCause?: string | null;
  symptoms?: string | null;
  workaround?: string | null;
  contributingFactors?: string[] | null;
  fiveWhys?: string[] | null;
  isKnownError?: boolean;
  owner?: {id: string; name: string} | null;
  incidents?: Incident[];
};

const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export function ProblemDetail({initial}: {initial: Problem}) {
  const router = useRouter();
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const canManage = ['ADMIN', 'AGENT'].includes((useSession().data?.user as {role?: string} | undefined)?.role ?? '');

  const {data: problem = initial} = useQuery({
    queryKey: ['problem', initial.id],
    queryFn: () => apiGet<Problem>(`/api/problems/${initial.id}`),
    initialData: initial,
    staleTime: 0,
  });

  const [rca, setRca] = useState({
    rootCause: initial.rootCause ?? '',
    symptoms: initial.symptoms ?? '',
    workaround: initial.workaround ?? '',
    isKnownError: initial.isKnownError ?? false,
    status: initial.status,
    resolveLinkedIncidents: false,
  });
  const [whys, setWhys] = useState<string[]>(() => {
    const arr = asArray(initial.fiveWhys);
    return [...arr, '', '', '', '', ''].slice(0, 5);
  });
  const [ticketId, setTicketId] = useState('');

  const invalidate = () => queryClient.invalidateQueries({queryKey: ['problem', initial.id]});

  const saveRca = useMutation({
    mutationFn: () =>
      apiSend(`/api/problems/${initial.id}/root-cause`, 'POST', {
        rootCause: rca.rootCause,
        symptoms: rca.symptoms || undefined,
        workaround: rca.workaround || undefined,
        fiveWhys: whys.filter((w) => w.trim()),
        isKnownError: rca.isKnownError,
        status: rca.status,
        resolveLinkedIncidents: rca.resolveLinkedIncidents,
      }),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Root cause analysis saved'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const linkIncident = useMutation({
    mutationFn: () => apiSend(`/api/problems/${initial.id}/link-incident`, 'POST', {ticketId: ticketId.toUpperCase()}),
    onSuccess: () => {
      setTicketId('');
      invalidate();
      toast({tone: 'success', title: 'Incident linked'});
    },
    onError: (err) => toast({tone: 'error', title: 'Link failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const unlinkIncident = useMutation({
    mutationFn: (tid: string) => apiSend(`/api/problems/${initial.id}/link-incident?ticketId=${tid}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Incident unlinked'});
    },
    onError: (err) => toast({tone: 'error', title: 'Unlink failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/problems')}>
          <ArrowLeft className="h-4 w-4" /> Problems
        </Button>
        <span className="font-mono font-bold text-primary">{problem.id}</span>
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <Badge tone={problemStatusTone[problem.status] ?? 'neutral'}>{humanize(problem.status)}</Badge>
        {problem.isKnownError && <Badge tone="warning">Known error</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-2 font-bold">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: problem.description}} />
          </Card>

          {canManage ? (
            <Card className="p-5">
              <h3 className="mb-3 font-bold">Root cause analysis</h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rca.rootCause.trim().length >= 3) saveRca.mutate();
                  else toast({tone: 'error', title: 'Root cause is required'});
                }}
              >
                <label className="block text-sm">
                  <span className="font-semibold">Root cause</span>
                  <Textarea className="mt-1 min-h-16" value={rca.rootCause} onChange={(e) => setRca({...rca, rootCause: e.target.value})} required />
                </label>

                <div>
                  <span className="text-sm font-semibold">5 Whys</span>
                  <div className="mt-1 space-y-2">
                    {whys.map((w, i) => (
                      <Input key={i} placeholder={`Why #${i + 1}`} value={w} onChange={(e) => setWhys(whys.map((x, j) => (j === i ? e.target.value : x)))} />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-semibold">Symptoms</span>
                    <Textarea className="mt-1 min-h-16" value={rca.symptoms} onChange={(e) => setRca({...rca, symptoms: e.target.value})} />
                  </label>
                  <label className="block text-sm">
                    <span className="font-semibold">Workaround</span>
                    <Textarea className="mt-1 min-h-16" value={rca.workaround} onChange={(e) => setRca({...rca, workaround: e.target.value})} />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="text-sm">
                    <span className="font-semibold">Status</span>
                    <select className="input ml-2 inline-block w-auto" value={rca.status} onChange={(e) => setRca({...rca, status: e.target.value})}>
                      {['INVESTIGATING', 'IDENTIFIED', 'MITIGATED', 'CLOSED'].map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={rca.isKnownError} onChange={(e) => setRca({...rca, isKnownError: e.target.checked})} />
                    Known error
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={rca.resolveLinkedIncidents} onChange={(e) => setRca({...rca, resolveLinkedIncidents: e.target.checked})} />
                    Resolve linked incidents on close
                  </label>
                </div>

                <Button type="submit" size="sm" loading={saveRca.isPending}>
                  Save analysis
                </Button>
              </form>
            </Card>
          ) : (
            problem.rootCause && (
              <Card className="p-5">
                <h3 className="mb-2 font-bold">Root cause</h3>
                <p className="whitespace-pre-wrap text-sm leading-7">{problem.rootCause}</p>
              </Card>
            )
          )}
        </section>

        <aside className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-3 font-bold">Linked incidents</h3>
            {(problem.incidents?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No linked incidents.</p>
            ) : (
              <ul className="divide-y divide-border">
                {problem.incidents!.map((inc) => (
                  <li key={inc.ticketId} className="flex items-center gap-2 py-2 text-sm">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Link href={`/tickets/${inc.ticketId}`} className="min-w-0 flex-1 truncate hover:underline">
                      <span className="font-mono text-primary">{inc.ticketId}</span>
                      {inc.ticket ? ` · ${inc.ticket.title}` : ''}
                    </Link>
                    {canManage && (
                      <button onClick={() => unlinkIncident.mutate(inc.ticketId)} aria-label="Unlink" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManage && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (ticketId.trim()) linkIncident.mutate();
                }}
              >
                <Input placeholder="TKT-0001" value={ticketId} onChange={(e) => setTicketId(e.target.value)} />
                <Button type="submit" size="sm" variant="outline" loading={linkIncident.isPending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 font-bold">Details</h3>
            <p className="text-sm text-muted-foreground">Owner: {problem.owner?.name ?? '—'}</p>
            {asArray(problem.contributingFactors).length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold">Contributing factors</p>
                <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                  {asArray(problem.contributingFactors).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
