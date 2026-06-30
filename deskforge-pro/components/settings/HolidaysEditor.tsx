'use client';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {CalendarPlus, Trash2} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

type Holiday = {id: string; date: string; description: string};

export function HolidaysEditor() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({date: '', description: ''});

  const {data} = useQuery({queryKey: ['holidays'], queryFn: () => apiGet<{holidays: Holiday[]}>('/api/settings/holidays')});
  const holidays = data?.holidays ?? [];
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['holidays']});

  const add = useMutation({
    mutationFn: () => apiSend('/api/settings/holidays', 'POST', {date: form.date, description: form.description}),
    onSuccess: () => {
      setForm({date: '', description: ''});
      invalidate();
      toast({tone: 'success', title: 'Holiday added'});
    },
    onError: (err) => toast({tone: 'error', title: 'Add failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/api/settings/holidays?id=${id}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Holiday removed'});
    },
    onError: (err) => toast({tone: 'error', title: 'Remove failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-xl font-bold">Holiday calendar</h2>
      <form
        className="mb-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.date && form.description.trim().length >= 2) add.mutate();
        }}
      >
        <label className="text-sm">
          <span className="font-semibold">Date</span>
          <Input type="date" className="mt-1 w-auto" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
        </label>
        <label className="flex-1 text-sm">
          <span className="font-semibold">Description</span>
          <Input className="mt-1" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Company holiday" required />
        </label>
        <Button type="submit" size="sm" variant="outline" loading={add.isPending}>
          <CalendarPlus className="h-4 w-4" /> Add
        </Button>
      </form>

      {holidays.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holidays configured.</p>
      ) : (
        <ul className="divide-y divide-border">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-2.5 text-sm">
              <b>{new Date(h.date).toLocaleDateString()}</b>
              <span className="text-muted-foreground">{h.description}</span>
              <button onClick={() => remove.mutate(h.id)} aria-label="Remove holiday" className="ml-auto text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
