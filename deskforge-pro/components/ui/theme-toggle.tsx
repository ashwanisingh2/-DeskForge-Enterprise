'use client';
import {useEffect, useState} from 'react';
import {useTheme} from 'next-themes';
import {Monitor, Moon, Sun} from 'lucide-react';
import {cn} from '@/lib/utils';

const options = [
  {value: 'light', icon: Sun, label: 'Light theme'},
  {value: 'system', icon: Monitor, label: 'System theme'},
  {value: 'dark', icon: Moon, label: 'Dark theme'},
] as const;

export function ThemeToggle() {
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[7.5rem] rounded-lg border border-border bg-muted" aria-hidden />;
  }

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border border-border bg-muted p-0.5">
      {options.map(({value, icon: Icon, label}) => {
        const active = (theme ?? 'system') === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'grid h-8 w-9 place-items-center rounded-md transition-colors',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
