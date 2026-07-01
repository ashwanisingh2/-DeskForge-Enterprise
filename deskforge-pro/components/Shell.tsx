'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cog,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
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

type NavItem = {label: string; href: string; icon: typeof Ticket; adminOnly?: boolean; badge?: string};

const nav: NavItem[] = [
  {label: 'Dashboard',     href: '/dashboard', icon: LayoutDashboard},
  {label: 'Tickets',       href: '/tickets',   icon: Ticket},
  {label: 'Asset & CMDB',  href: '/assets',    icon: Boxes},
  {label: 'Changes',       href: '/changes',   icon: GitPullRequest},
  {label: 'Problems',      href: '/problems',  icon: ShieldAlert},
  {label: 'Service Catalog',href: '/catalog',  icon: ClipboardList},
  {label: 'Knowledge',     href: '/kb',        icon: FileText},
  {label: 'Analytics',     href: '/analytics', icon: TrendingUp},
  {label: 'Users',         href: '/users',     icon: Users,       adminOnly: true},
  {label: 'Settings',      href: '/settings',  icon: Cog,         adminOnly: true},
  {label: 'Audit Log',     href: '/audit',     icon: ScrollText,  adminOnly: true},
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Breadcrumb({pathname}: {pathname: string}) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return <span className="font-semibold text-foreground">DeskForge</span>;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className={cn(i === parts.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground capitalize')}>
            {part.replace(/-/g, ' ')}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function Shell({children}: {children: React.ReactNode}) {
  const {data} = useSession();
  const pathname = usePathname();
  const role = (data?.user as {role?: string} | undefined)?.role;
  const items = nav.filter((item) => !item.adminOnly || role === 'ADMIN');

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? 72 : 256;

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4', collapsed && 'justify-center px-0')}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg">
          <LifeBuoy className="h-4 w-4 text-white" />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="logo-text"
              initial={{opacity:0,width:0}}
              animate={{opacity:1,width:'auto'}}
              exit={{opacity:0,width:0}}
              transition={{duration:.18}}
              className="overflow-hidden whitespace-nowrap text-lg font-extrabold text-white"
            >
              DeskForge Pro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
        <ul className="space-y-0.5 px-2">
          {items.map(({label, href, icon: Icon, badge}) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    active
                      ? 'bg-white/12 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sky-400 before:content-[""]'
                      : 'text-slate-400 hover:bg-white/8 hover:text-slate-100',
                  )}
                >
                  <Icon className={cn('shrink-0 transition-colors', active ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-300', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        key={`label-${href}`}
                        initial={{opacity:0,width:0}}
                        animate={{opacity:1,width:'auto'}}
                        exit={{opacity:0,width:0}}
                        transition={{duration:.15}}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && badge && (
                    <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">{badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className={cn('shrink-0 border-t border-white/10 p-3', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <button
            onClick={() => signOut({callbackUrl: '/login'})}
            aria-label="Sign out"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 text-xs font-bold text-white">
                {(data?.user?.name ?? 'U').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{data?.user?.name ?? '—'}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{role ?? ''}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({callbackUrl: '/login'})}
              className="mt-2.5 inline-flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{paddingLeft: `${sidebarW}px`}}>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{width: sidebarW}}
        transition={{duration:.22, ease:[.4,0,.2,1]}}
        className="fixed inset-y-0 left-0 z-30 hidden overflow-hidden bg-[#080f1e] lg:block"
        style={{width: sidebarW}}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 z-10 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#0e1a30] text-slate-400 shadow-md transition-colors hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{x:-280}} animate={{x:0}} exit={{x:-280}}
              transition={{duration:.25, ease:[.4,0,.2,1]}}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#080f1e] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6"
        style={{background: 'var(--glass-bg)', backdropFilter:'blur(20px) saturate(1.6)', WebkitBackdropFilter:'blur(20px) saturate(1.6)'}}>

        {/* Mobile menu */}
        <button
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Breadcrumb pathname={pathname} />

        <div className="ml-auto flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => window.dispatchEvent(new Event('deskforge:open-command-palette'))}
            className="hidden items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
          </button>

          <ThemeToggle />

          {/* Notification bell */}
          <button
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background" aria-hidden />
          </button>

          {/* Create button */}
          <Link href="/tickets/create">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Create
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="min-h-[calc(100vh-4rem)] p-5 sm:p-7">
        {children}
      </main>

      <CommandPalette />
    </div>
  );
}
