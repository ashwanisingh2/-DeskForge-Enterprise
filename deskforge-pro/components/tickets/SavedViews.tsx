'use client';
import {useEffect, useState} from 'react';
import {Bookmark, Plus, Trash2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {DEFAULT_FILTERS, type TicketFilterState} from './ticket-options';

const STORAGE_KEY = 'deskforge.ticketViews.v1';

type SavedView = {id: string; name: string; filters: TicketFilterState};

const QUICK_VIEWS: {name: string; filters: Partial<TicketFilterState>}[] = [
  {name: 'All', filters: {}},
  {name: 'Open', filters: {status: 'OPEN'}},
  {name: 'In progress', filters: {status: 'IN_PROGRESS'}},
  {name: 'Unassigned', filters: {assigneeId: 'unassigned'}},
  {name: 'Critical', filters: {priority: 'CRITICAL'}},
  {name: 'SLA breached', filters: {slaStatus: 'BREACHED'}},
];

function load(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

type Props = {
  current: TicketFilterState;
  onApply: (filters: TicketFilterState) => void;
};

export function SavedViews({current, onApply}: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeName, setActiveName] = useState<string>('All');

  useEffect(() => setViews(load()), []);

  const persist = (next: SavedView[]) => {
    setViews(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const applyQuick = (name: string, partial: Partial<TicketFilterState>) => {
    setActiveName(name);
    onApply({...DEFAULT_FILTERS, ...partial});
  };

  const saveCurrent = () => {
    const name = window.prompt('Name this view');
    if (!name?.trim()) return;
    const view: SavedView = {id: `${Date.now()}`, name: name.trim(), filters: current};
    persist([...views.filter((v) => v.name !== view.name), view]);
    setActiveName(view.name);
  };

  const remove = (id: string, name: string) => {
    persist(views.filter((v) => v.id !== id));
    if (activeName === name) setActiveName('All');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUICK_VIEWS.map((v) => (
        <button
          key={v.name}
          onClick={() => applyQuick(v.name, v.filters)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            activeName === v.name ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {v.name}
        </button>
      ))}

      {views.map((v) => (
        <span
          key={v.id}
          className={cn(
            'group inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-2 text-sm font-medium transition-colors',
            activeName === v.name ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <button
            className="inline-flex items-center gap-1"
            onClick={() => {
              setActiveName(v.name);
              onApply(v.filters);
            }}
          >
            <Bookmark className="h-3.5 w-3.5" /> {v.name}
          </button>
          <button onClick={() => remove(v.id, v.name)} aria-label={`Delete ${v.name} view`} className="opacity-50 transition-opacity hover:opacity-100">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      <Button variant="outline" size="sm" onClick={saveCurrent}>
        <Plus className="h-4 w-4" /> Save view
      </Button>
    </div>
  );
}
