'use client';
import {AnimatePresence, motion} from 'framer-motion';
import {Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/input';
import {humanize, PRIORITY_OPTIONS, STATUS_OPTIONS} from './ticket-options';

type Agent = {id: string; name: string};
export type BulkAction = {action: 'status' | 'priority' | 'assignee' | 'delete'; value?: string | null};

type Props = {
  count: number;
  agents: Agent[];
  canDelete: boolean;
  pending: boolean;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
};

export function BulkActionBar({count, agents, canDelete, pending, onAction, onClear}: Props) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: 12}}
          transition={{duration: 0.18}}
          className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-[min(60rem,calc(100%-2rem))] flex-wrap items-center gap-3 rounded-xl border border-border bg-popover/95 p-3 px-4 text-popover-foreground shadow-xl backdrop-blur"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="font-semibold">
            {count} selected
          </span>

          <Select
            aria-label="Set status"
            disabled={pending}
            value=""
            onChange={(e) => e.target.value && onAction({action: 'status', value: e.target.value})}
            className="w-auto"
          >
            <option value="">Set status…</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Set priority"
            disabled={pending}
            value=""
            onChange={(e) => e.target.value && onAction({action: 'priority', value: e.target.value})}
            className="w-auto"
          >
            <option value="">Set priority…</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {humanize(p)}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Assign to"
            disabled={pending}
            value=""
            onChange={(e) => e.target.value && onAction({action: 'assignee', value: e.target.value})}
            className="w-auto"
          >
            <option value="">Assign to…</option>
            <option value="unassigned">Unassign</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              loading={pending}
              onClick={() => {
                if (window.confirm(`Delete ${count} ticket(s)? This can be restored by an administrator.`)) onAction({action: 'delete'});
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
            <X className="h-4 w-4" /> Clear
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
