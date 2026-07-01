'use client';
import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Save} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/toast';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const DEFAULTS: Record<string, {responseTimeHrs: number; resolutionTimeHrs: number}> = {
  CRITICAL: {responseTimeHrs: 1, resolutionTimeHrs: 4},
  HIGH: {responseTimeHrs: 4, resolutionTimeHrs: 8},
  MEDIUM: {responseTimeHrs: 8, resolutionTimeHrs: 24},
  LOW: {responseTimeHrs: 24, resolutionTimeHrs: 72},
};
const tone = (p: string) => (p === 'CRITICAL' ? 'danger' : p === 'HIGH' ? 'warning' : p === 'MEDIUM' ? 'info' : 'neutral');

type Config = {priority: string; responseTimeHrs: number; resolutionTimeHrs: number};

export function SlaEditor() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const {data} = useQuery({queryKey: ['sla'], queryFn: () => apiGet<{configs: Config[]}>('/api/settings/sla')});
  const [rows, setRows] = useState<Config[]>([]);

  useEffect(() => {
    const existing = data?.configs ?? [];
    setRows(PRIORITIES.map((p) => existing.find((c) => c.priority === p) ?? {priority: p, ...DEFAULTS[p]}));
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiSend('/api/settings/sla', 'PUT', {configs: rows}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['sla']});
      toast({tone: 'success', title: 'SLA policy saved'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const update = (priority: string, patch: Partial<Config>) => setRows((prev) => prev.map((r) => (r.priority === priority ? {...r, ...patch} : r)));

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-xl font-bold">SLA policy</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.priority} className="flex flex-wrap items-center gap-3 border-t border-border py-2.5 text-sm">
            <Badge tone={tone(r.priority)} className="w-24 justify-center">
              {r.priority}
            </Badge>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Response</span>
              <Input type="number" min={1} className="h-9 w-20" value={r.responseTimeHrs} onChange={(e) => update(r.priority, {responseTimeHrs: Number(e.target.value)})} />
              <span className="text-muted-foreground">h</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Resolution</span>
              <Input type="number" min={1} className="h-9 w-20" value={r.resolutionTimeHrs} onChange={(e) => update(r.priority, {resolutionTimeHrs: Number(e.target.value)})} />
              <span className="text-muted-foreground">h</span>
            </label>
          </div>
        ))}
      </div>
      <Button className="mt-4" size="sm" loading={save.isPending} onClick={() => save.mutate()}>
        <Save className="h-4 w-4" /> Save SLA policy
      </Button>
    </Card>
  );
}
