'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {Boxes, Plus, Search} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {useDebounce} from '@/lib/hooks/use-debounce';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Select} from '@/components/ui/input';
import {TableSkeleton} from '@/components/ui/skeleton';
import {ASSET_STATUSES, ASSET_TYPES, assetStatusTone, type AssetStatus} from './asset-options';

export type Asset = {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string | null;
  owner?: {id: string; name: string} | null;
};

export function AssetList() {
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const isAdmin = role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search);

  const params = new URLSearchParams();
  if (debounced) params.set('search', debounced);
  if (type) params.set('type', type);
  if (status) params.set('status', status);

  const {data, isLoading} = useQuery({
    queryKey: ['assets', debounced, type, status],
    queryFn: () => apiGet<{assets: Asset[]; total: number}>(`/api/assets?${params.toString()}`),
  });
  const assets = data?.assets ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Asset & CMDB</h1>
          <p className="text-muted-foreground">Configuration ownership, lifecycle and impact relationships.</p>
        </div>
        {isAdmin && (
          <Link href="/assets/new">
            <Button>
              <Plus className="h-4 w-4" /> New asset
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by tag, name or serial…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search assets" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto" aria-label="Type">
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Status">
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <Boxes className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No assets found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Name</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Serial</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-accent/50">
                  <td>
                    <Link className="font-mono font-bold text-primary hover:underline" href={`/assets/${a.id}`}>
                      {a.assetTag}
                    </Link>
                  </td>
                  <td className="font-medium">{a.name}</td>
                  <td className="text-muted-foreground">{a.type}</td>
                  <td className="text-muted-foreground">{a.owner?.name ?? 'Unassigned'}</td>
                  <td>
                    <Badge tone={assetStatusTone[a.status as AssetStatus] ?? 'neutral'}>{a.status}</Badge>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{a.serialNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
