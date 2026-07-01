'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {Plus, ShieldAlert} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Select} from '@/components/ui/input';
import {TableSkeleton} from '@/components/ui/skeleton';
import {Pager} from '@/components/ui/pager';
import {PROBLEM_STATUSES, humanize, problemStatusTone} from './problem-options';

export type Problem = {
  id: string;
  title: string;
  status: string;
  isKnownError?: boolean;
  owner?: {name: string} | null;
  _count?: {incidents: number};
};

export function ProblemList() {
  const {data: session} = useSession();
  const canManage = ['ADMIN', 'AGENT'].includes((session?.user as {role?: string} | undefined)?.role ?? '');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({page: String(page), limit: '25'});
  if (status) params.set('status', status);
  const {data, isLoading} = useQuery({queryKey: ['problems', status, page], queryFn: () => apiGet<{problems: Problem[]; total: number; totalPages: number}>(`/api/problems?${params.toString()}`)});
  const problems = (data?.problems ?? []).filter((p) => !status || p.status === status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Problem Management</h1>
          <p className="text-muted-foreground">Remove root causes behind recurring incidents.</p>
        </div>
        {canManage && (
          <Link href="/problems/new">
            <Button>
              <Plus className="h-4 w-4" /> New problem
            </Button>
          </Link>
        )}
      </div>

      <Select value={status} onChange={(e) => {setStatus(e.target.value); setPage(1);}} className="w-auto" aria-label="Status filter">
        <option value="">All statuses</option>
        {PROBLEM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </Select>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No problems recorded</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Problem</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Incidents</th>
                <th>Known error</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-accent/50">
                  <td>
                    <Link className="font-mono font-bold text-primary hover:underline" href={`/problems/${p.id}`}>
                      {p.id}
                    </Link>
                  </td>
                  <td className="font-medium">{p.title}</td>
                  <td>
                    <Badge tone={problemStatusTone[p.status] ?? 'neutral'}>{humanize(p.status)}</Badge>
                  </td>
                  <td className="text-muted-foreground">{p.owner?.name ?? '—'}</td>
                  <td className="text-muted-foreground">{p._count?.incidents ?? 0}</td>
                  <td>{p.isKnownError ? <Badge tone="warning">Known error</Badge> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Pager page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} onPage={setPage} />
    </div>
  );
}
