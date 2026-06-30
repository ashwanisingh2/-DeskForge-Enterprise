'use client';
import {Activity} from 'lucide-react';

type Log = {id: string; action: string; detail?: string | null; oldValue?: string | null; newValue?: string | null; createdAt: string; user?: {name: string} | null};

const humanize = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function ActivityTimeline({logs}: {logs: Log[]}) {
  if (logs.length === 0) return <p className="px-1 text-sm text-muted-foreground">No activity recorded.</p>;
  return (
    <ol className="relative ml-3 space-y-5 border-l border-border pl-6">
      {logs.map((log) => (
        <li key={log.id} className="relative">
          <span className="absolute -left-[1.95rem] top-0.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground">
            <Activity className="h-3 w-3" />
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <b className="text-sm">{humanize(log.action)}</b>
            {log.oldValue || log.newValue ? (
              <span className="text-sm text-muted-foreground">
                {log.oldValue ? `${humanize(log.oldValue)} → ` : ''}
                {log.newValue ? humanize(log.newValue) : ''}
              </span>
            ) : (
              log.detail && <span className="text-sm text-muted-foreground">{log.detail}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {log.user?.name ? `${log.user.name} · ` : ''}
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
