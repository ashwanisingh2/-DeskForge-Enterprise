'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import {
  Bell,
  Boxes,
  ClipboardList,
  Cog,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Plus,
  ScrollText,
  Search,
  ShieldAlert,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ThemeToggle} from '@/components/ui/theme-toggle';
import {CommandPalette} from '@/components/CommandPalette';

type NavItem = {label: string; href: string; icon: typeof Ticket; adminOnly?: boolean};

const nav: NavItem[] = [
  {label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
  {label: 'Tickets', href: '/tickets', icon: Ticket},
  {label: 'Asset & CMDB', href: '/assets', icon: Boxes},
  {label: 'Changes', href: '/changes', icon: GitPullRequest},
  {label: 'Problems', href: '/problems', icon: ShieldAlert},
  {label: 'Service Catalog', href: '/catalog', icon: ClipboardList},
  {label: 'Knowledge', href: '/kb', icon: FileText},
  {label: 'Analytics', href: '/analytics', icon: TrendingUp},
  {label: 'Users', href: '/users', icon: Users, adminOnly: true},
  {label: 'Settings', href: '/settings', icon: Cog, adminOnly: true},
  {label: 'Audit Log', href: '/audit', icon: ScrollText, adminOnly: true},
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({children}: {children: React.ReactNode}) {
  const {data} = useSession();
  const pathname = usePathname();
  const role = (data?.user as {role?: string} | undefined)?.role;
  const items = nav.filter((item) => !item.adminOnly || role === 'ADMIN');

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 p-4 text-slate-300 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2 text-xl font-extrabold text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-amber-400 text-slate-950">
            <LifeBuoy className="h-5 w-5" />
          </span>
          DeskForge Pro
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map(({label, href, icon: Icon}) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive(pathname, href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <p className="truncate font-semibold text-white">{data?.user?.name ?? 'Signed in'}</p>
          <p className="text-xs text-slate-400">{role ?? ''}</p>
          <button
            onClick={() => signOut({callbackUrl: '/login'})}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-5 backdrop-blur sm:px-7">
        <b className="truncate capitalize text-foreground">
          {pathname.split('/').filter(Boolean).join(' / ') || 'DeskForge'}
        </b>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event('deskforge:open-command-palette'))}
            className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span>Search…</span>
            <kbd className="rounded border border-border px-1.5 text-xs">⌘K</kbd>
          </button>
          <ThemeToggle />
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link href="/tickets/create">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-5 sm:p-7">{children}</main>
      <CommandPalette />
    </div>
  );
}
