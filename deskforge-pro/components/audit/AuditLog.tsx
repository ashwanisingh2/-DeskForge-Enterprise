'use client';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ScrollText, Search} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {useDebounce} from '@/lib/hooks/use-debounce';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Select} from '@/components/ui/input';
import {TableSkeleton} from '@/components/ui/skeleton';

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user?: {name: string} | null;
  ipAddress?: string | null;
  createdAt: string;
  oldValue?: unknown;
  newValue?: unknown;
};

const ENTITY_TYPES = ['Ticket', 'Asset', 'Change', 'Problem', 'KBArticle', 'CatalogItem', 'User', 'SLAConfig'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'BULK_UPDATE', 'LOGIN', 'MERGE', 'LINK', 'UNLINK', 'DEACTIVATE', 'CI_LINK', 'TIME_ENTRY'];
const actionTone = (action: string) =>
  action.includes('DELETE') || action.includes('DEACTIVATE') ? 'danger' : action.includes('CREATE') ? 'success' : action.includes('LOGIN') ? 'info' : 'warning';

const preview = (v: unknown) => {
  if (v === null || v === undefined) return '';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

export function AuditLog() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = new URLSearchParams({page: String(page), limit: '50'});
  if (debounced) params.set('search', debounced);
  if (entityType) params.set('entityType', entityType);
  if (action) params.set('action', action);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const {data, isLoading} = useQuery({
    queryKey: ['audit', debounced, entityType, action, dateFrom, dateTo, page],
    queryFn: () => apiGet<{logs: Log[]; total: number; totalPages: number}>(`/api/audit?${params.toString()}`),
  });
  const logs = data?.logs ?? [];
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Security and data-change events across the tenant.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by entity ID…" value={search} onChange={(e) => {setSearch(e.target.value); resetPage();}} className="pl-9" aria-label="Search audit" />
        </div>
        <Select value={entityType} onChange={(e) => {setEntityType(e.target.value); resetPage();}} className="w-auto" aria-label="Entity type">
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select value={action} onChange={(e) => {setAction(e.target.value); resetPage();}} className="w-auto" aria-label="Action">
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => {setDateFrom(e.target.value); resetPage();}} className="w-auto" aria-label="From date" />
        <Input type="date" value={dateTo} onChange={(e) => {setDateTo(e.target.value); resetPage();}} className="w-auto" aria-label="To date" />
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No audit events</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>ID</th>
                <th>User</th>
                <th>Changes</th>
                <th>IP</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td>
                    <Badge tone={actionTone(log.action)}>{log.action.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="text-muted-foreground">{log.entityType}</td>
                  <td className="font-mono text-xs text-primary">{log.entityId}</td>
                  <td>{log.user?.name ?? '—'}</td>
                  <td className="max-w-xs">
                    {log.newValue || log.oldValue ? (
                      <code className="block truncate text-xs text-muted-foreground" title={`${preview(log.oldValue)} → ${preview(log.newValue)}`}>
                        {log.oldValue && log.newValue
                          ? `${preview(log.oldValue)} → ${preview(log.newValue)}`
                          : preview(log.newValue) || preview(log.oldValue)}
                      </code>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{log.ipAddress ?? '—'}</td>
                  <td className="whitespace-nowrap text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{data?.total ?? 0} events</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="px-1">Page {page} / {data?.totalPages ?? 1}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
