'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation, useQuery} from '@tanstack/react-query';
import {ArrowLeft, Save} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Select} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {ASSET_STATUSES, ASSET_TYPES} from './asset-options';

type AssetForm = {
  id?: string;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string | null;
  ownerId?: string | null;
  purchaseDate?: string | null;
  warrantyEnd?: string | null;
};

const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export function AssetEditor({initial}: {initial?: AssetForm}) {
  const router = useRouter();
  const {toast} = useToast();
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState({
    assetTag: initial?.assetTag ?? '',
    name: initial?.name ?? '',
    type: initial?.type ?? 'Laptop',
    status: initial?.status ?? 'OPERATIONAL',
    serialNumber: initial?.serialNumber ?? '',
    ownerId: initial?.ownerId ?? '',
    purchaseDate: toDateInput(initial?.purchaseDate),
    warrantyEnd: toDateInput(initial?.warrantyEnd),
  });

  const owners = useQuery({queryKey: ['agents'], queryFn: () => apiGet<{users: {id: string; name: string}[]}>('/api/users'), staleTime: 5 * 60_000});

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        assetTag: form.assetTag,
        name: form.name,
        type: form.type,
        status: form.status,
        serialNumber: form.serialNumber || undefined,
        ownerId: form.ownerId || null,
        purchaseDate: form.purchaseDate || null,
        warrantyEnd: form.warrantyEnd || null,
      };
      return isEdit ? apiSend<{id: string}>(`/api/assets/${initial!.id}`, 'PATCH', payload) : apiSend<{id: string}>('/api/assets', 'POST', payload);
    },
    onSuccess: (asset) => {
      toast({tone: 'success', title: isEdit ? 'Asset updated' : 'Asset created'});
      router.push(`/assets/${asset.id}`);
      router.refresh();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? (err.code === 'P2002' || err.status === 409 ? 'Asset tag already exists' : err.message) : 'Error';
      toast({tone: 'error', title: 'Save failed', description: msg});
    },
  });

  const valid = form.assetTag.trim().length >= 2 && form.name.trim().length >= 2 && form.type.trim().length >= 2;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit asset' : 'New asset'}</h1>
      </div>

      <Card className="p-5">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <Labeled label="Asset tag">
            <Input value={form.assetTag} onChange={(e) => setForm({...form, assetTag: e.target.value})} placeholder="AST-1001" required />
          </Labeled>
          <Labeled label="Name">
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Dell Latitude 7440" required />
          </Labeled>
          <Labeled label="Type">
            <Select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Labeled>
          <Labeled label="Status">
            <Select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Labeled>
          <Labeled label="Serial number">
            <Input value={form.serialNumber} onChange={(e) => setForm({...form, serialNumber: e.target.value})} placeholder="DL-7440-001" />
          </Labeled>
          <Labeled label="Owner">
            <Select value={form.ownerId} onChange={(e) => setForm({...form, ownerId: e.target.value})}>
              <option value="">Unassigned</option>
              {(owners.data?.users ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Labeled>
          <Labeled label="Purchase date">
            <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({...form, purchaseDate: e.target.value})} />
          </Labeled>
          <Labeled label="Warranty end">
            <Input type="date" value={form.warrantyEnd} onChange={(e) => setForm({...form, warrantyEnd: e.target.value})} />
          </Labeled>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!valid}>
              <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Create asset'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Labeled({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
