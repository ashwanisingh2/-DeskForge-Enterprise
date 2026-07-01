'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation, useQuery} from '@tanstack/react-query';
import {ArrowLeft, Plus, Save, X} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Select, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {APPROVER_ROLES, CHANGE_RISKS, CHANGE_TYPES, humanize} from './change-options';

type Approver = {approverId: string; approverRole: string};

export function ChangeEditor() {
  const router = useRouter();
  const {toast} = useToast();

  const [form, setForm] = useState({
    title: '',
    type: 'NORMAL',
    risk: '',
    description: '',
    implementationPlan: '',
    rollbackPlan: '',
    windowStart: '',
    windowEnd: '',
  });
  const [approvers, setApprovers] = useState<Approver[]>([]);

  const agents = useQuery({queryKey: ['agents'], queryFn: () => apiGet<{users: {id: string; name: string}[]}>('/api/users'), staleTime: 5 * 60_000});

  const save = useMutation({
    mutationFn: () =>
      apiSend<{id: string}>('/api/changes', 'POST', {
        title: form.title,
        type: form.type,
        risk: form.risk || undefined,
        description: form.description,
        implementationPlan: form.implementationPlan,
        rollbackPlan: form.rollbackPlan || undefined,
        windowStart: form.windowStart || null,
        windowEnd: form.windowEnd || null,
        approvers: approvers.filter((a) => a.approverId),
      }),
    onSuccess: (change) => {
      toast({tone: 'success', title: 'Change created'});
      router.push(`/changes/${change.id}`);
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const valid = form.title.trim().length >= 4 && form.description.trim().length >= 10 && form.implementationPlan.trim().length >= 10;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">New change request</h1>
      </div>

      <Card className="p-5">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-semibold">Title</span>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required minLength={4} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold">Type</span>
              <Select className="mt-1" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                {CHANGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Risk (auto if blank)</span>
              <Select className="mt-1" value={form.risk} onChange={(e) => setForm({...form, risk: e.target.value})}>
                <option value="">Auto-calculate</option>
                {CHANGE_RISKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-semibold">Description</span>
            <Textarea className="mt-1 min-h-20" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Implementation plan</span>
            <Textarea className="mt-1 min-h-20" value={form.implementationPlan} onChange={(e) => setForm({...form, implementationPlan: e.target.value})} required />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Rollback plan</span>
            <Textarea className="mt-1 min-h-20" value={form.rollbackPlan} onChange={(e) => setForm({...form, rollbackPlan: e.target.value})} placeholder="Required for high/critical risk" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold">Window start</span>
              <Input type="datetime-local" className="mt-1" value={form.windowStart} onChange={(e) => setForm({...form, windowStart: e.target.value})} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Window end</span>
              <Input type="datetime-local" className="mt-1" value={form.windowEnd} onChange={(e) => setForm({...form, windowEnd: e.target.value})} />
            </label>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Approvers</p>
            {approvers.map((a, i) => (
              <div key={i} className="mt-2 flex items-center gap-2">
                <Select value={a.approverId} onChange={(e) => setApprovers(approvers.map((x, j) => (j === i ? {...x, approverId: e.target.value} : x)))} className="w-auto flex-1">
                  <option value="">Select user…</option>
                  {(agents.data?.users ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
                <Select value={a.approverRole} onChange={(e) => setApprovers(approvers.map((x, j) => (j === i ? {...x, approverRole: e.target.value} : x)))} className="w-auto">
                  {APPROVER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {humanize(r)}
                    </option>
                  ))}
                </Select>
                <button type="button" onClick={() => setApprovers(approvers.filter((_, j) => j !== i))} aria-label="Remove approver" className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setApprovers([...approvers, {approverId: '', approverRole: 'TECH_APPROVER'}])}>
              <Plus className="h-4 w-4" /> Add approver
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!valid}>
              <Save className="h-4 w-4" /> Create change
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
