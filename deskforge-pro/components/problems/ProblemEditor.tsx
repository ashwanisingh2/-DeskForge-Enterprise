'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation, useQuery} from '@tanstack/react-query';
import {ArrowLeft, Save} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Select, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {PROBLEM_STATUSES, humanize} from './problem-options';

export function ProblemEditor() {
  const router = useRouter();
  const {toast} = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    ownerId: '',
    status: 'INVESTIGATING',
    symptoms: '',
    workaround: '',
    isKnownError: false,
    ticketIds: '',
  });

  const agents = useQuery({queryKey: ['agents'], queryFn: () => apiGet<{users: {id: string; name: string}[]}>('/api/users'), staleTime: 5 * 60_000});

  const save = useMutation({
    mutationFn: () =>
      apiSend<{id: string}>('/api/problems', 'POST', {
        title: form.title,
        description: form.description,
        ownerId: form.ownerId,
        status: form.status,
        symptoms: form.symptoms || undefined,
        workaround: form.workaround || undefined,
        isKnownError: form.isKnownError,
        ticketIds: form.ticketIds.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean),
      }),
    onSuccess: (problem) => {
      toast({tone: 'success', title: 'Problem created'});
      router.push(`/problems/${problem.id}`);
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const valid = form.title.trim().length >= 4 && form.description.trim().length >= 10 && form.ownerId;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">New problem</h1>
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
          <label className="block text-sm">
            <span className="font-semibold">Description</span>
            <Textarea className="mt-1 min-h-20" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold">Owner</span>
              <Select className="mt-1" value={form.ownerId} onChange={(e) => setForm({...form, ownerId: e.target.value})} required>
                <option value="">Select owner…</option>
                {(agents.data?.users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Status</span>
              <Select className="mt-1" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                {PROBLEM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-semibold">Symptoms</span>
            <Textarea className="mt-1 min-h-16" value={form.symptoms} onChange={(e) => setForm({...form, symptoms: e.target.value})} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Workaround</span>
            <Textarea className="mt-1 min-h-16" value={form.workaround} onChange={(e) => setForm({...form, workaround: e.target.value})} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Link incidents (ticket IDs, comma-separated)</span>
            <Input className="mt-1" value={form.ticketIds} onChange={(e) => setForm({...form, ticketIds: e.target.value})} placeholder="TKT-0001, TKT-0002" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isKnownError} onChange={(e) => setForm({...form, isKnownError: e.target.checked})} />
            Mark as known error
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!valid}>
              <Save className="h-4 w-4" /> Create problem
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
