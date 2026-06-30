'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import {useTheme} from 'next-themes';
import {useQuery} from '@tanstack/react-query';
import {AnimatePresence, motion} from 'framer-motion';
import {
  Boxes,
  ClipboardList,
  Cog,
  CornerDownLeft,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Plus,
  ScrollText,
  Search,
  ShieldAlert,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {useDebounce} from '@/lib/hooks/use-debounce';
import {cn} from '@/lib/utils';

type Command = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: typeof Ticket;
  keywords?: string;
  perform: () => void;
};

type TicketHit = {id: string; title: string; status: string};

export function CommandPalette() {
  const router = useRouter();
  const {data: session} = useSession();
  const {setTheme, resolvedTheme} = useTheme();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const isAdmin = role === 'ADMIN';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query, 250);

  // Global open/close shortcut and external open trigger.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('deskforge:open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('deskforge:open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const close = () => setOpen(false);
  const run = (fn: () => void) => {
    close();
    fn();
  };

  const navCommands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const base: Command[] = [
      {id: 'nav-dashboard', label: 'Dashboard', group: 'Navigate', icon: LayoutDashboard, perform: go('/dashboard')},
      {id: 'nav-tickets', label: 'Tickets', group: 'Navigate', icon: Ticket, perform: go('/tickets')},
      {id: 'nav-assets', label: 'Asset & CMDB', group: 'Navigate', icon: Boxes, perform: go('/assets')},
      {id: 'nav-changes', label: 'Changes', group: 'Navigate', icon: GitPullRequest, perform: go('/changes')},
      {id: 'nav-problems', label: 'Problems', group: 'Navigate', icon: ShieldAlert, perform: go('/problems')},
      {id: 'nav-catalog', label: 'Service Catalog', group: 'Navigate', icon: ClipboardList, perform: go('/catalog')},
      {id: 'nav-kb', label: 'Knowledge Base', group: 'Navigate', icon: FileText, perform: go('/kb')},
      {id: 'nav-analytics', label: 'Analytics', group: 'Navigate', icon: TrendingUp, perform: go('/analytics')},
    ];
    if (isAdmin) {
      base.push(
        {id: 'nav-users', label: 'Users', group: 'Navigate', icon: Users, perform: go('/users')},
        {id: 'nav-settings', label: 'Settings', group: 'Navigate', icon: Cog, perform: go('/settings')},
        {id: 'nav-audit', label: 'Audit Log', group: 'Navigate', icon: ScrollText, perform: go('/audit')},
      );
    }
    return base;
  }, [router, isAdmin]);

  const actionCommands = useMemo<Command[]>(
    () => [
      {id: 'act-create', label: 'Create new ticket', hint: 'C', group: 'Actions', icon: Plus, keywords: 'new add', perform: () => router.push('/tickets/create')},
      {
        id: 'act-theme',
        label: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`,
        group: 'Actions',
        icon: MoonStar,
        keywords: 'dark light mode appearance',
        perform: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
      {id: 'act-signout', label: 'Sign out', group: 'Actions', icon: LogOut, keywords: 'logout exit', perform: () => signOut({callbackUrl: '/login'})},
    ],
    [router, setTheme, resolvedTheme],
  );

  const staticMatches = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const all = [...navCommands, ...actionCommands];
    if (!q) return all;
    return all.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [debounced, navCommands, actionCommands]);

  const ticketSearch = useQuery({
    queryKey: ['command-tickets', debounced],
    queryFn: () => apiGet<{tickets: TicketHit[]}>(`/api/tickets?search=${encodeURIComponent(debounced)}&limit=6`),
    enabled: open && debounced.trim().length >= 2,
  });

  const ticketCommands = useMemo<Command[]>(
    () =>
      (ticketSearch.data?.tickets ?? []).map((t) => ({
        id: `ticket-${t.id}`,
        label: t.title,
        hint: t.id,
        group: 'Tickets',
        icon: Ticket,
        perform: () => router.push(`/tickets/${t.id}`),
      })),
    [ticketSearch.data, router],
  );

  const commands = useMemo(() => [...staticMatches, ...ticketCommands], [staticMatches, ticketCommands]);

  useEffect(() => setActive(0), [debounced, commands.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = commands[active];
      if (cmd) run(cmd.perform);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  // Keep the active item scrolled into view.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({block: 'nearest'});
  }, [active]);

  // Group consecutive commands for rendering while keeping a flat index.
  let flatIndex = -1;
  const groups = commands.reduce<Record<string, {cmd: Command; index: number}[]>>((acc, cmd) => {
    flatIndex++;
    (acc[cmd.group] ??= []).push({cmd, index: flatIndex});
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.12}}
          onMouseDown={close}
        >
          <motion.div
            role="dialog"
            aria-label="Command palette"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
            initial={{opacity: 0, y: -12, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -12, scale: 0.98}}
            transition={{duration: 0.14}}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search tickets or jump to…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Command palette search"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:block">Esc</kbd>
            </div>

            <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
              {commands.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {ticketSearch.isFetching ? 'Searching…' : 'No results'}
                </p>
              )}
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                  {items.map(({cmd, index}) => {
                    const Icon = cmd.icon;
                    const isActive = index === active;
                    return (
                      <button
                        key={cmd.id}
                        data-active={isActive}
                        onMouseMove={() => setActive(index)}
                        onClick={() => run(cmd.perform)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          isActive ? 'bg-accent text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-foreground">{cmd.label}</span>
                        {cmd.hint && <span className="font-mono text-xs text-muted-foreground">{cmd.hint}</span>}
                        {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
