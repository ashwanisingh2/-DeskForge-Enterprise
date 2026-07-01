'use client';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {AlarmClock, AlertTriangle, CheckCircle2, Clock, Gauge, Inbox, Loader2, ShieldX, TicketCheck, Timer} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import type {DashboardData} from '@/lib/analytics';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {PriorityBadge, StatusBadge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';

const STATUS_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#f97316', '#eab308', '#10b981', '#64748b'];
const PRIORITY_COLORS: Record<string, string> = {LOW: '#94a3b8', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444'};
const AXIS = '#94a3b8';

type Kpi = {label: string; value: string | number; icon: typeof Inbox; tone: string};

function ChartTooltip({active, payload, label}: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="capitalize">
          <span style={{color: p.color ?? p.fill}}>●</span> {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
}

export function Dashboard({initial}: {initial: DashboardData}) {
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const canView = role === 'ADMIN' || role === 'AGENT';

  const {data, isFetching} = useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiGet<DashboardData>('/api/analytics'),
    initialData: initial,
    enabled: canView,
    refetchInterval: canView ? 30_000 : false,
    refetchOnWindowFocus: canView,
  });

  const d = data ?? initial;

  const kpis: Kpi[] = [
    {label: 'Total tickets', value: d.totalTickets, icon: Inbox, tone: 'text-slate-400'},
    {label: 'Open', value: d.openTickets, icon: TicketCheck, tone: 'text-blue-500'},
    {label: 'In progress', value: d.inProgressTickets ?? 0, icon: Loader2, tone: 'text-violet-500'},
    {label: 'Resolved today', value: d.resolvedToday, icon: CheckCircle2, tone: 'text-emerald-500'},
    {label: 'Overdue', value: d.overdueTickets, icon: AlarmClock, tone: 'text-orange-500'},
    {label: 'Critical open', value: d.criticalOpen ?? 0, icon: AlertTriangle, tone: 'text-red-500'},
    {label: 'SLA breached', value: d.slaBreached ?? 0, icon: ShieldX, tone: 'text-red-500'},
    {label: 'Avg resolution', value: `${d.avgResolutionTime}h`, icon: Timer, tone: 'text-cyan-500'},
    {label: 'SLA compliance', value: `${d.slaCompliance}%`, icon: Gauge, tone: 'text-emerald-500'},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            Live service health and team performance
            {canView && isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </p>
        </div>
        <Link href="/tickets/create">
          <Button>New ticket</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="card-hover p-4 hover-glow">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
                <span className={cn('rounded-lg p-1.5', kpi.tone.replace('text-','bg-').replace('-500','-500/15').replace('-400','-400/15'))}>
                  <Icon className={cn('h-3.5 w-3.5', kpi.tone)} />
                </span>
              </div>
              <strong className="mt-3 block text-3xl font-bold tabular-nums tracking-tight">{kpi.value}</strong>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-bold">Ticket trend · last 14 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.trendLast14Days} margin={{left: -20, right: 8, top: 4}}>
              <defs>
                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} fill="url(#gCreated)" />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#gResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold">By status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={d.ticketsByStatus.filter((s) => s.count > 0)} dataKey="count" nameKey="status" innerRadius={52} outerRadius={80} paddingAngle={2}>
                {d.ticketsByStatus.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {d.ticketsByStatus.filter((s) => s.count > 0).map((s, i) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{background: STATUS_COLORS[i % STATUS_COLORS.length]}} />
                  {s.status.replace(/_/g, ' ')}
                </span>
                <b>{s.count}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-4 font-bold">By priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.ticketsByPriority ?? []} margin={{left: -20, right: 8}}>
              <XAxis dataKey="priority" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
              <Tooltip content={<ChartTooltip />} cursor={{fill: 'rgba(148,163,184,0.1)'}} />
              <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                {(d.ticketsByPriority ?? []).map((p) => (
                  <Cell key={p.priority} fill={PRIORITY_COLORS[p.priority] ?? '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-bold">Recent activity</h3>
          {(d.recentTickets ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent tickets.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(d.recentTickets ?? []).map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary">
                    <span className="font-mono text-xs font-bold text-primary">{t.id}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                    <span className="hidden sm:block">
                      <PriorityBadge value={t.priority as never} />
                    </span>
                    <StatusBadge value={t.status as never} />
                    <span className="hidden whitespace-nowrap text-xs text-muted-foreground md:block">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
