'use client';
import {Search, X} from 'lucide-react';
import {Input, Select} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  CATEGORY_OPTIONS,
  DEFAULT_FILTERS,
  humanize,
  PRIORITY_OPTIONS,
  SLA_OPTIONS,
  STATUS_OPTIONS,
  type TicketFilterState,
} from './ticket-options';

type Agent = {id: string; name: string};

type Props = {
  value: TicketFilterState;
  onChange: (next: Partial<TicketFilterState>) => void;
  onReset: () => void;
  agents: Agent[];
  showAssignee: boolean;
};

export function TicketFilters({value, onChange, onReset, agents, showAssignee}: Props) {
  const isDirty = JSON.stringify({...value, search: ''}) !== JSON.stringify({...DEFAULT_FILTERS, search: ''}) || value.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[16rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search tickets"
          placeholder="Search by ID, title or description…"
          value={value.search}
          onChange={(e) => onChange({search: e.target.value})}
          className="pl-9"
        />
      </div>

      <Select aria-label="Status" value={value.status} onChange={(e) => onChange({status: e.target.value})} className="w-auto">
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </Select>

      <Select aria-label="Priority" value={value.priority} onChange={(e) => onChange({priority: e.target.value})} className="w-auto">
        <option value="">All priorities</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {humanize(p)}
          </option>
        ))}
      </Select>

      <Select aria-label="Category" value={value.category} onChange={(e) => onChange({category: e.target.value})} className="w-auto">
        <option value="">All categories</option>
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select aria-label="SLA status" value={value.slaStatus} onChange={(e) => onChange({slaStatus: e.target.value})} className="w-auto">
        <option value="">All SLA</option>
        {SLA_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </Select>

      {showAssignee && (
        <Select aria-label="Assignee" value={value.assigneeId} onChange={(e) => onChange({assigneeId: e.target.value})} className="w-auto">
          <option value="">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      )}

      <Input aria-label="Created from" type="date" value={value.dateFrom} onChange={(e) => onChange({dateFrom: e.target.value})} className="w-auto" />
      <Input aria-label="Created to" type="date" value={value.dateTo} onChange={(e) => onChange({dateTo: e.target.value})} className="w-auto" />

      {isDirty && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
