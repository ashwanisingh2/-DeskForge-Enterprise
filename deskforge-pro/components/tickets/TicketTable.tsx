'use client';
import Link from 'next/link';
import {ArrowDown, ArrowUp, ChevronsUpDown} from 'lucide-react';
import {cn} from '@/lib/utils';
import {PriorityBadge, SlaBadge, StatusBadge} from '@/components/ui/badge';

export type TicketRow = {
  id: string;
  title: string;
  status: any;
  priority: any;
  slaStatus?: any;
  category: string;
  createdAt: string;
  dueDate?: string | null;
  requester?: {name: string} | null;
  assignee?: {id: string; name: string} | null;
};

type Column = {key: string; label: string; sortable?: boolean; className?: string};

const columns: Column[] = [
  {key: 'id', label: 'ID', sortable: true, className: 'w-28'},
  {key: 'title', label: 'Title', sortable: true},
  {key: 'requester', label: 'Requester'},
  {key: 'assignee', label: 'Assignee'},
  {key: 'category', label: 'Category'},
  {key: 'priority', label: 'Priority', sortable: true},
  {key: 'status', label: 'Status', sortable: true},
  {key: 'slaStatus', label: 'SLA'},
  {key: 'createdAt', label: 'Created', sortable: true, className: 'w-28'},
];

type Props = {
  tickets: TicketRow[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  selectable: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
};

export function TicketTable({tickets, sortBy, sortOrder, onSort, selectable, selected, onToggle, onToggleAll}: Props) {
  const allSelected = tickets.length > 0 && tickets.every((t) => selected.has(t.id));

  return (
    <table className="table">
      <thead>
        <tr>
          {selectable && (
            <th className="w-10">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </th>
          )}
          {columns.map((col) => (
            <th key={col.key} className={col.className}>
              {col.sortable ? (
                <button
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => onSort(col.key)}
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label}
                  {sortBy === col.key ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                  )}
                </button>
              ) : (
                col.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr
            key={t.id}
            className={cn('transition-colors hover:bg-accent/50', selected.has(t.id) && 'bg-primary/5')}
          >
            {selectable && (
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${t.id}`}
                  checked={selected.has(t.id)}
                  onChange={() => onToggle(t.id)}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
              </td>
            )}
            <td>
              <Link className="font-mono font-bold text-primary hover:underline" href={`/tickets/${t.id}`}>
                {t.id}
              </Link>
            </td>
            <td className="max-w-md truncate font-medium">{t.title}</td>
            <td className="text-muted-foreground">{t.requester?.name ?? '—'}</td>
            <td className="text-muted-foreground">{t.assignee?.name ?? 'Unassigned'}</td>
            <td className="text-muted-foreground">{t.category}</td>
            <td>
              <PriorityBadge value={t.priority} />
            </td>
            <td>
              <StatusBadge value={t.status} />
            </td>
            <td>{t.slaStatus ? <SlaBadge value={t.slaStatus} /> : '—'}</td>
            <td className="whitespace-nowrap text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
