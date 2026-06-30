'use client';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Clock, Plus} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {Input, Select, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

type Entry = {id: string; workDate: string; durationMinutes: number; description: string; workType: string; billable: boolean; user: {name: string}};
type Response = {entries: Entry[]; totalMinutes: number; billableMinutes: number};

const WORK_TYPES = ['REMOTE', 'ON_SITE', 'PHONE', 'RESEARCH', 'ADMIN'] as const;

const formatMinutes = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
const today = () => new Date().toISOString().slice(0, 10);

export function TimeTracking({ticketId, canLog}: {ticketId: string; canLog: boolean}) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({workDate: today(), durationMinutes: '', description: '', workType: 'REMOTE', billable: false});

  const {data, isLoading} = useQuery({queryKey: ['time-entries', ticketId], queryFn: () => apiGet<Response>(`/api/tickets/${ticketId}/time-entries`)});

  const add = useMutation({
    mutationFn: () =>
      apiSend(`/api/tickets/${ticketId}/time-entries`, 'POST', {
        workDate: form.workDate,
        durationMinutes: Number(form.durationMinutes),
        description: form.description,
        workType: form.workType,
        billable: form.billable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['time-entries', ticketId]});
      queryClient.invalidateQueries({queryKey: ['ticket', ticketId]});
      setForm({workDate: today(), durationMinutes: '', description: '', workType: 'REMOTE', billable: false});
      toast({tone: 'success', title: 'Time logged'});
    },
    onError: (err) => toast({tone: 'error', title: 'Could not log time', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total logged</p>
          <p className="text-lg font-bold">{formatMinutes(data?.totalMinutes ?? 0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Billable</p>
          <p className="text-lg font-bold">{formatMinutes(data?.billableMinutes ?? 0)}</p>
        </div>
      </div>

      {canLog && (
        <form
          className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(form.durationMinutes) > 0 && form.description.trim()) add.mutate();
          }}
        >
          <label className="text-sm">
            <span className="font-semibold">Date</span>
            <Input type="date" className="mt-1" value={form.workDate} max={today()} onChange={(e) => setForm({...form, workDate: e.target.value})} />
          </label>
          <label className="text-sm">
            <span className="font-semibold">Minutes</span>
            <Input type="number" min={1} max={1440} className="mt-1" value={form.durationMinutes} onChange={(e) => setForm({...form, durationMinutes: e.target.value})} required />
          </label>
          <label className="text-sm">
            <span className="font-semibold">Work type</span>
            <Select className="mt-1" value={form.workType} onChange={(e) => setForm({...form, workType: e.target.value})}>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" className="mb-2.5 h-4 w-4 accent-primary" checked={form.billable} onChange={(e) => setForm({...form, billable: e.target.checked})} />
            <span className="mb-2 font-semibold">Billable</span>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="font-semibold">Description</span>
            <Textarea className="mt-1 min-h-16" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" loading={add.isPending}>
              <Plus className="h-4 w-4" /> Log time
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time logged yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 p-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.description}</p>
                <p className="text-xs text-muted-foreground">
                  {e.user.name} · {new Date(e.workDate).toLocaleDateString()} · {e.workType.replace('_', ' ')}
                  {e.billable ? ' · Billable' : ''}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatMinutes(e.durationMinutes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
