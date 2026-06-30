'use client';
import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {keepPreviousData, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Inbox, Plus} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {useDebounce} from '@/lib/hooks/use-debounce';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {TableSkeleton} from '@/components/ui/skeleton';
import {useToast} from '@/components/ui/toast';
import {TicketFilters} from '@/components/tickets/TicketFilters';
import {SavedViews} from '@/components/tickets/SavedViews';
import {BulkActionBar, type BulkAction} from '@/components/tickets/BulkActionBar';
import {TicketTable, type TicketRow} from '@/components/tickets/TicketTable';
import {DEFAULT_FILTERS, type TicketFilterState} from '@/components/tickets/ticket-options';

const LIMIT = 25;

type TicketsResponse = {tickets: TicketRow[]; total: number; page: number; totalPages: number};
type AgentsResponse = {users: {id: string; name: string; role: string}[]};

function buildQuery(filters: TicketFilterState, search: string, page: number) {
  const params = new URLSearchParams({page: String(page), limit: String(LIMIT), sortBy: filters.sortBy, sortOrder: filters.sortOrder});
  if (search) params.set('search', search);
  for (const key of ['status', 'priority', 'category', 'assigneeId', 'slaStatus', 'dateFrom', 'dateTo'] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return params.toString();
}

export function TicketList() {
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const canManage = role === 'ADMIN' || role === 'AGENT';
  const canDelete = role === 'ADMIN';

  const queryClient = useQueryClient();
  const {toast} = useToast();

  const [filters, setFilters] = useState<TicketFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(filters.search);

  const queryString = buildQuery(filters, debouncedSearch, page);

  const ticketsQuery = useQuery({
    queryKey: ['tickets', queryString],
    queryFn: () => apiGet<TicketsResponse>(`/api/tickets?${queryString}`),
    placeholderData: keepPreviousData,
  });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiGet<AgentsResponse>('/api/users'),
    enabled: canManage,
    staleTime: 5 * 60_000,
  });
  const agents = agentsQuery.data?.users ?? [];

  // Reset selection whenever the visible result set changes.
  useEffect(() => setSelected(new Set()), [queryString]);

  const bulkMutation = useMutation({
    mutationFn: (action: BulkAction) =>
      apiSend<{updated: number; skipped: {id: string; reason: string}[]}>('/api/tickets/bulk', 'POST', {
        ids: Array.from(selected),
        action: action.action,
        value: action.value,
      }),
    onSuccess: (res, action) => {
      queryClient.invalidateQueries({queryKey: ['tickets']});
      setSelected(new Set());
      const skippedNote = res.skipped.length ? `, ${res.skipped.length} skipped` : '';
      toast({tone: 'success', title: `${res.updated} ticket(s) updated`, description: `${action.action}${skippedNote}`});
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Bulk action failed';
      toast({tone: 'error', title: 'Action failed', description: message});
    },
  });

  const updateFilters = (next: Partial<TicketFilterState>) => {
    setFilters((prev) => ({...prev, ...next}));
    setPage(1);
  };

  const applyView = (view: TicketFilterState) => {
    setFilters(view);
    setPage(1);
  };

  const onSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPage(1);
  };

  const tickets = ticketsQuery.data?.tickets ?? [];
  const total = ticketsQuery.data?.total ?? 0;
  const totalPages = ticketsQuery.data?.totalPages ?? 1;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const allOnPage = tickets.every((t) => prev.has(t.id));
      if (allOnPage) return new Set();
      return new Set(tickets.map((t) => t.id));
    });

  const showEmpty = !ticketsQuery.isLoading && tickets.length === 0;
  const rangeStart = useMemo(() => (total === 0 ? 0 : (page - 1) * LIMIT + 1), [page, total]);
  const rangeEnd = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-4">
      <SavedViews current={filters} onApply={applyView} />
      <TicketFilters value={filters} onChange={updateFilters} onReset={() => applyView(DEFAULT_FILTERS)} agents={agents} showAssignee={canManage} />

      <Card className="overflow-x-auto p-0">
        {ticketsQuery.isLoading ? (
          <TableSkeleton rows={8} cols={canManage ? 10 : 9} />
        ) : ticketsQuery.isError ? (
          <div className="p-12 text-center text-sm text-destructive">
            {ticketsQuery.error instanceof ApiError ? ticketsQuery.error.message : 'Failed to load tickets'}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => ticketsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No tickets match these filters</p>
            <p className="text-sm text-muted-foreground">Try clearing filters or create a new ticket.</p>
            <Link href="/tickets/create">
              <Button size="sm" className="mt-1">
                <Plus className="h-4 w-4" /> New ticket
              </Button>
            </Link>
          </div>
        ) : (
          <TicketTable
            tickets={tickets}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={onSort}
            selectable={canManage}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total > 0 ? `${rangeStart}–${rangeEnd} of ${total}` : '0 results'}
          {ticketsQuery.isFetching && !ticketsQuery.isLoading ? ' · updating…' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="px-1">
            Page {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {canManage && (
        <BulkActionBar
          count={selected.size}
          agents={agents}
          canDelete={canDelete}
          pending={bulkMutation.isPending}
          onAction={(action) => bulkMutation.mutate(action)}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
