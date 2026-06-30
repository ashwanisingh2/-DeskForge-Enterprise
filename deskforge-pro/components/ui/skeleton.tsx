import {cn} from '@/lib/utils';

export function Skeleton({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function TableSkeleton({rows = 8, cols = 6}: {rows?: number; cols?: number}) {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Loading">
      {Array.from({length: rows}).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({length: cols}).map((_, c) => (
            <Skeleton key={c} className={cn('h-4', c === 1 ? 'flex-1' : 'w-20')} />
          ))}
        </div>
      ))}
    </div>
  );
}
