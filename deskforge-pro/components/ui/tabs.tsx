'use client';
import {cn} from '@/lib/utils';

export type TabItem = {value: string; label: string; count?: number};

export function Tabs({tabs, value, onChange}: {tabs: TabItem[]; value: string; onChange: (v: string) => void}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({name, className}: {name: string; className?: string}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary', className)}>
      {initials || '?'}
    </span>
  );
}
