'use client';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {AlertTriangle, CheckCircle2, Clock, Loader2, ShieldX, TrendingUp} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import type {DashboardData} from '@/lib/analytics';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Select} from '@/components/ui/input';

// Demo analytics data — richer breakdowns than the main dashboard
const demoData: DashboardData & {
  topCategories: {category: string; count: number}[];
  resolutionByPriority: {priority: string; avgHrs: number}[];
} = {
  totalTickets: 25,
  openTickets: 7,
  inProgressTickets: 5,
  resolvedToday: 3,
  overdueTickets: 2,
  criticalOpen: 1,
  slaBreached: 2,
  avgResolutionTime: 5.6,
  slaCompliance: 92,
  ticketsByStatus: [
    {status: 'OPEN', count: 7},
    {status: 'IN_PROGRESS', count: 5},
    {status: 'PENDING_CUSTOMER', count: 3},
    {status: 'ON_HOLD', count: 2},
    {status: 'RESOLVED', count: 5},
    {status: 'CLOSED', count: 3},
  ],
  ticketsByPriority: [
    {priority: 'LOW', count: 6},
    {priority: 'MEDIUM', count: 11},
    {priority: 'HIGH', count: 6},
    {priority: 'CRITICAL', count: 2},
  ],
  ticketsByCategory: [
    {category: 'Network', count: 8},
    {category: 'Email', count: 6},
    {category: 'Hardware', count: 5},
    {category: 'Software', count: 4},
    {category: 'Printer', count: 2},
  ],
  trendLast14Days: [...Array(14)].map((_, i) => ({
    day: new Date(Date.now() - (13 - i) * 864e5).toLocaleDateString('en', {weekday: 'short'}),
    created: [1, 3, 2, 4, 1, 0, 2, 5, 3, 2, 4, 1, 3, 2][i],
    resolved: [0, 1, 2, 1, 3, 1, 2, 2, 4, 1, 2, 3, 2, 3][i],
  })),
  recentTickets: [],
  topCategories: [
    {category: 'Network', count: 8},
    {category: 'Email', count: 6},
    {category: 'Hardware', count: 5},
    {category: 'Software', count: 4},
    {category: 'Printer', count: 2},
  ],
  resolutionByPriority: [
    {priority: 'CRITICAL', avgHrs: 2.1},
    {priority: 'HIGH', avgHrs: 4.8},
    {priority: 'MEDIUM', avgHrs: 8.3},
    {priority: 'LOW', avgHrs: 18.2},
  ],
};

const AXIS = '#94a3b8';
const CAT_COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const PRIORITY_COLORS: Record<string, string> = {LOW: '#94a3b8', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444'};

function ChartTooltip({active, payload, label}: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name}>
          <span style={{color: p.color ?? p.fill}}>● </span>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
}

function KpiCard({icon: Icon, label, value, tone}: {icon: typeof TrendingUp; label: string; value: string | number; tone: string}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${tone}`} />
      </CardContent>
    </Card>
  );
}

export function AnalyticsView() {
  const [period, setPeriod] = useState('14');

  const {data: live, isLoading, isFetching} = useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiGet<DashboardData>('/api/analytics'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Use live data when available, fallback to rich demo data.
  const d = (live as any) ?? demoData;
  const topCategories: {category: string; count: number}[] = (d as any).topCategories ?? d.ticketsByCategory?.slice(0, 5) ?? [];
  const resolutionByPriority: {priority: string; avgHrs: number}[] = (d as any).resolutionByPriority ?? demoData.resolutionByPriority;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            Ticket performance, SLA and resolution insights
            {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </p>
        </div>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto" aria-label="Period">
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </Select>
      </div>

      {/* KPIs — different subset from dashboard */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={TrendingUp} label="SLA compliance" value={`${d.slaCompliance}%`} tone="text-emerald-500" />
        <KpiCard icon={ShieldX} label="SLA breached" value={d.slaBreached ?? 0} tone="text-red-500" />
        <KpiCard icon={Clock} label="Avg resolution" value={`${d.avgResolutionTime}h`} tone="text-cyan-500" />
        <KpiCard icon={AlertTriangle} label="Overdue" value={d.overdueTickets} tone="text-orange-500" />
        <KpiCard icon={CheckCircle2} label="Resolved today" value={d.resolvedToday} tone="text-emerald-500" />
        <KpiCard icon={TrendingUp} label="Total tickets" value={d.totalTickets} tone="text-muted-foreground" />
        <KpiCard icon={Loader2} label="Open" value={d.openTickets} tone="text-blue-500" />
        <KpiCard icon={TrendingUp} label="In progress" value={d.inProgressTickets ?? 0} tone="text-violet-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Tickets by category (horizontal bar) */}
        <Card>
          <CardHeader><CardTitle>Volume by category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCategories} layout="vertical" margin={{left: 8, right: 16}}>
                <XAxis type="number" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{fill: 'rgba(148,163,184,0.1)'}} />
                <Bar dataKey="count" name="Tickets" radius={[0, 6, 6, 0]}>
                  {topCategories.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA status distribution (donut) */}
        <Card>
          <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={d.ticketsByStatus.filter((s: any) => s.count > 0)} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {d.ticketsByStatus.map((_: any, i: number) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(v) => v.replace(/_/g, ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avg resolution time by priority */}
        <Card>
          <CardHeader><CardTitle>Avg resolution time by priority (hours)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resolutionByPriority} margin={{left: -20, right: 8}}>
                <XAxis dataKey="priority" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{fill: 'rgba(148,163,184,0.1)'}} />
                <Bar dataKey="avgHrs" name="Avg hours" radius={[6, 6, 0, 0]}>
                  {resolutionByPriority.map((r) => <Cell key={r.priority} fill={PRIORITY_COLORS[r.priority] ?? '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority breakdown */}
        <Card>
          <CardHeader><CardTitle>Tickets by priority</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.ticketsByPriority ?? []} margin={{left: -20, right: 8}}>
                <XAxis dataKey="priority" tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill: AXIS, fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{fill: 'rgba(148,163,184,0.1)'}} />
                <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                  {(d.ticketsByPriority ?? []).map((p: any) => <Cell key={p.priority} fill={PRIORITY_COLORS[p.priority] ?? '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
