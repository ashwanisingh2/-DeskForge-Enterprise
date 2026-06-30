'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, Link2, Network, Pencil, Plus, Trash2} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Select} from '@/components/ui/input';
import {QrCode} from '@/components/ui/qr-code';
import {useToast} from '@/components/ui/toast';
import {CI_RELATIONSHIP_TYPES, assetStatusTone, humanizeRelation, type AssetStatus} from './asset-options';

type CI = {id: string; type: string; target?: {id: string; assetTag: string; name: string}; source?: {id: string; assetTag: string; name: string}};
type Asset = {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string | null;
  owner?: {id: string; name: string} | null;
  purchaseDate?: string | null;
  warrantyEnd?: string | null;
  relationships?: CI[];
  relatedFrom?: CI[];
};

export function AssetDetail({initial}: {initial: Asset}) {
  const router = useRouter();
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const {data: session} = useSession();
  const isAdmin = (session?.user as {role?: string} | undefined)?.role === 'ADMIN';

  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState<string>('DEPENDS_ON');

  const {data: asset = initial} = useQuery({
    queryKey: ['asset', initial.id],
    queryFn: () => apiGet<Asset>(`/api/assets/${initial.id}`),
    initialData: initial,
    staleTime: 0,
  });

  const otherAssets = useQuery({
    queryKey: ['assets-picker'],
    queryFn: () => apiGet<{assets: {id: string; assetTag: string; name: string}[]}>('/api/assets?limit=200'),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({queryKey: ['asset', initial.id]});

  const addRel = useMutation({
    mutationFn: () => apiSend(`/api/assets/${initial.id}/relationships`, 'POST', {targetId, type: relType}),
    onSuccess: () => {
      setTargetId('');
      invalidate();
      toast({tone: 'success', title: 'Relationship added'});
    },
    onError: (err) => toast({tone: 'error', title: 'Could not link', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const removeRel = useMutation({
    mutationFn: (relId: string) => apiSend(`/api/assets/${initial.id}/relationships?relId=${relId}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Relationship removed'});
    },
    onError: (err) => toast({tone: 'error', title: 'Could not remove', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const removeAsset = useMutation({
    mutationFn: () => apiSend(`/api/assets/${initial.id}`, 'DELETE'),
    onSuccess: () => {
      toast({tone: 'success', title: 'Asset deleted'});
      router.push('/assets');
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Delete failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const warrantyExpired = asset.warrantyEnd ? new Date(asset.warrantyEnd) < new Date() : false;
  const pickerOptions = (otherAssets.data?.assets ?? []).filter((a) => a.id !== initial.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/assets')}>
          <ArrowLeft className="h-4 w-4" /> Assets
        </Button>
        <span className="font-mono font-bold text-primary">{asset.assetTag}</span>
        <h1 className="text-2xl font-bold">{asset.name}</h1>
        <Badge tone={assetStatusTone[asset.status as AssetStatus] ?? 'neutral'}>{asset.status}</Badge>
        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/assets/${asset.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={removeAsset.isPending}
              onClick={() => {
                if (window.confirm('Delete this asset? This cannot be undone.')) removeAsset.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-4 font-bold">Details</h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="Type" value={asset.type} />
            <Row label="Owner" value={asset.owner?.name ?? 'Unassigned'} />
            <Row label="Serial" value={asset.serialNumber ?? '—'} mono />
            <Row label="Purchased" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'} />
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Warranty</dt>
              <dd className="font-medium">
                {asset.warrantyEnd ? (
                  <span className={warrantyExpired ? 'text-destructive' : ''}>
                    {new Date(asset.warrantyEnd).toLocaleDateString()}
                    {warrantyExpired && ' · expired'}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <Network className="h-4 w-4" /> CMDB relationships
          </h3>

          {(asset.relationships?.length ?? 0) + (asset.relatedFrom?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No relationships defined.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {asset.relationships?.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Badge tone="info">{humanizeRelation(r.type)}</Badge>
                  <Link href={`/assets/${r.target?.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
                    <span className="font-mono text-primary">{r.target?.assetTag}</span> · {r.target?.name}
                  </Link>
                  {isAdmin && (
                    <button onClick={() => removeRel.mutate(r.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
              {asset.relatedFrom?.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Badge tone="neutral">{humanizeRelation(r.type)} (incoming)</Badge>
                  <Link href={`/assets/${r.source?.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
                    <span className="font-mono text-primary">{r.source?.assetTag}</span> · {r.source?.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (targetId) addRel.mutate();
              }}
            >
              <Select value={relType} onChange={(e) => setRelType(e.target.value)} className="w-auto" aria-label="Relationship type">
                {CI_RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanizeRelation(t)}
                  </option>
                ))}
              </Select>
              <Select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-auto" aria-label="Target asset">
                <option value="">Select asset…</option>
                {pickerOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} · {a.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="outline" loading={addRel.isPending} disabled={!targetId}>
                <Plus className="h-4 w-4" /> Add link
              </Button>
            </form>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center p-5">
          <h3 className="mb-3 self-start font-bold">Asset QR</h3>
          <QrCode value={asset.assetTag} label={asset.assetTag} size={132} />
          <p className="mt-2 text-center text-xs text-muted-foreground">Scan to identify this asset</p>
        </Card>
      </div>
    </div>
  );
}

function Row({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs' : 'truncate font-medium'}>{value}</dd>
    </div>
  );
}
