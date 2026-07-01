'use client';
import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Save} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type Row = {dayOfWeek: number; enabled: boolean; startHour: number; endHour: number};

export function BusinessHoursEditor() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const {data} = useQuery({queryKey: ['business-hours'], queryFn: () => apiGet<{hours: {dayOfWeek: number; startHour: number; endHour: number}[]}>('/api/settings/business-hours')});

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const existing = data?.hours ?? [];
    setRows(
      DAYS.map((_, day) => {
        const found = existing.find((h) => h.dayOfWeek === day);
        return {dayOfWeek: day, enabled: Boolean(found), startHour: found?.startHour ?? 9, endHour: found?.endHour ?? 18};
      }),
    );
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      apiSend('/api/settings/business-hours', 'PUT', {
        hours: rows.filter((r) => r.enabled && r.endHour > r.startHour).map((r) => ({dayOfWeek: r.dayOfWeek, startHour: r.startHour, endHour: r.endHour})),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['business-hours']});
      toast({tone: 'success', title: 'Business hours saved'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const update = (day: number, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? {...r, ...patch} : r)));

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-xl font-bold">Business hours</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.dayOfWeek} className="flex items-center gap-3 text-sm">
            <label className="flex w-32 items-center gap-2 font-medium">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={r.enabled} onChange={(e) => update(r.dayOfWeek, {enabled: e.target.checked})} />
              {DAYS[r.dayOfWeek]}
            </label>
            <Select className="w-auto" disabled={!r.enabled} value={r.startHour} onChange={(e) => update(r.dayOfWeek, {startHour: Number(e.target.value)})} aria-label={`${DAYS[r.dayOfWeek]} start`}>
              {Array.from({length: 24}).map((_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
            <span className="text-muted-foreground">to</span>
            <Select className="w-auto" disabled={!r.enabled} value={r.endHour} onChange={(e) => update(r.dayOfWeek, {endHour: Number(e.target.value)})} aria-label={`${DAYS[r.dayOfWeek]} end`}>
              {Array.from({length: 24}).map((_, h) => (
                <option key={h + 1} value={h + 1}>
                  {String(h + 1).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
            {r.enabled && r.endHour <= r.startHour && <span className="text-xs text-destructive">End must be after start</span>}
          </div>
        ))}
      </div>
      <Button className="mt-4" size="sm" loading={save.isPending} onClick={() => save.mutate()}>
        <Save className="h-4 w-4" /> Save hours
      </Button>
    </Card>
  );
}
