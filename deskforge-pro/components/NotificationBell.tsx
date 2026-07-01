'use client';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AnimatePresence, motion} from 'framer-motion';
import {Bell, Check, Clock, MessageSquare, TicketCheck, TriangleAlert} from 'lucide-react';
import {apiGet, apiSend} from '@/lib/api-client';
import {cn} from '@/lib/utils';

type Notification = {id: string; type: string; title: string; message: string; ticketId?: string | null; isRead: boolean; createdAt: string};

const typeIcon: Record<string, typeof Bell> = {
  ticket_assigned: TicketCheck,
  sla_warning: TriangleAlert,
  comment: MessageSquare,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {data} = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<{notifications: Notification[]; unread: number}>('/api/notifications'),
    refetchInterval: 60_000,
  });
  const notifications = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  const markRead = useMutation({
    mutationFn: (id?: string) => apiSend('/api/notifications', 'PATCH', id ? {id} : {}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['notifications']}),
  });

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity: 0, y: -8, scale: 0.97}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -8, scale: 0.97}}
            transition={{duration: 0.15}}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <b className="text-sm">Notifications</b>
              {unread > 0 && (
                <button onClick={() => markRead.mutate(undefined)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcon[n.type] ?? Clock;
                  const body = (
                    <div
                      className={cn('flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50', !n.isRead && 'bg-primary/5')}
                    >
                      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">{n.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />}
                    </div>
                  );
                  return n.ticketId ? (
                    <Link key={n.id} href={`/tickets/${n.ticketId}`} onClick={() => {setOpen(false); if (!n.isRead) markRead.mutate(n.id);}}>
                      {body}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)} className="cursor-pointer">
                      {body}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
