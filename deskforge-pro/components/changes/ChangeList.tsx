'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {GitPullRequest, Plus} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Select} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {CHANGE_STATUSES, changeStatusTone, humanize, riskTone} from './change-options';

export type Change = {
  id: string;
  title: string;
  type: string;
  risk: string;
  status: string;
  requester?: {name: string} | null;
  approvals?: {status: string}[];
};

export function ChangeList() {
  const {data: session} = useSession();
  const canManage = ['ADMIN', 'AGENT'].includes((session?.user as {role?: string} | undefined)?.role ?? '');
  const [status, setStatus] = useState('');

  const {data, isLoading} = useQuery({queryKey: ['changes'], queryFn: () => apiGet<{changes: Change[]}>('/api/changes')});
  const changes = (data?.changes ?? []).filter((c) => !status || c.status === status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Change Management</h1>
          <p className="text-muted-foreground">CAB-controlled implementation, risk and rollback readiness.</p>
        </div>
        {canManage && (
          <Link href="/changes/new">
            <Button>
              <Plus className="h-4 w-4" /> New change
            </Button>
          </Link>
        )}
      </div>

      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Status filter">
        <option value="">All statuses</option>
        {CHANGE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </Select>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 6}).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : changes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <GitPullRequest className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No change requests</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {changes.map((c) => {
            const approved = c.approvals?.filter((a) => a.status === 'APPROVED').length ?? 0;
            const total = c.approvals?.length ?? 0;
            return (
              <Link key={c.id} href={`/changes/${c.id}`} className="group">
                <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-primary">{c.id}</span>
                    <Badge tone={riskTone[c.risk] ?? 'neutral'}>{c.risk}</Badge>
                  </div>
                  <h2 className="my-2 line-clamp-2 font-bold group-hover:text-primary">{c.title}</h2>
                  <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                    <Badge tone={changeStatusTone[c.status] ?? 'neutral'}>{humanize(c.status)}</Badge>
                    <span className="text-muted-foreground">
                      {humanize(c.type)} · {approved}/{total} approved
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
