'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, Calendar, Clock, Tag, User, UserCog} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {Avatar, Tabs, type TabItem} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {PriorityBadge, SlaBadge, StatusBadge} from '@/components/ui/badge';
import {Conversation} from '@/components/tickets/detail/Conversation';
import {ActivityTimeline} from '@/components/tickets/detail/ActivityTimeline';
import {Attachments} from '@/components/tickets/detail/Attachments';
import {TimeTracking} from '@/components/tickets/detail/TimeTracking';
import {RelatedTickets} from '@/components/tickets/detail/RelatedTickets';
import {PropertiesPanel} from '@/components/tickets/detail/PropertiesPanel';
import {TicketActions} from '@/components/tickets/detail/TicketActions';

export function TicketDetail({initial}: {initial: any}) {
  const router = useRouter();
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const canManage = role === 'ADMIN' || role === 'AGENT';

  const {data} = useQuery({
    queryKey: ['ticket', initial.id],
    queryFn: () => apiGet<any>(`/api/tickets/${initial.id}`),
    initialData: initial,
    staleTime: 0,
  });

  const t = data ?? initial;
  const comments = t.comments ?? [];
  const logs = t.activityLogs ?? [];
  const relatedTo = t.relatedTo ?? [];
  const relatedFrom = t.relatedFrom ?? [];
  const relationCount = relatedTo.length + relatedFrom.length;

  const [tab, setTab] = useState('conversation');
  const tabs: TabItem[] = [
    {value: 'conversation', label: 'Conversation', count: comments.length},
    {value: 'activity', label: 'Activity', count: logs.length},
    {value: 'attachments', label: 'Attachments'},
    {value: 'time', label: 'Time'},
    {value: 'related', label: 'Related', count: relationCount},
  ];

  return (
    <div className="space-y-6">
      {/* Header card with meta + actions */}
      <Card className="glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-bold text-primary">{t.id}</span>
              <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
              <StatusBadge value={t.status} />
              <PriorityBadge value={t.priority} />
            </div>
          </div>
          <TicketActions ticket={t} canManage={canManage} />
        </div>

        {/* Meta strip */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <Meta icon={User} label="Requester" value={t.requester?.name ?? '—'} />
          <Meta icon={UserCog} label="Technician" value={t.assignee?.name ?? 'Unassigned'} />
          <Meta icon={Tag} label="Category" value={t.category ?? '—'} />
          <Meta icon={Calendar} label="Created" value={new Date(t.createdAt).toLocaleDateString()} />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">SLA:</span>
            {t.slaStatus ? <SlaBadge value={t.slaStatus} /> : '—'}
          </div>
          {Array.isArray(t.tags) && t.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {t.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={t.requester?.name ?? '?'} />
              <div>
                <b>{t.requester?.name}</b>
                <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-5 whitespace-pre-wrap text-sm leading-7" dangerouslySetInnerHTML={{__html: t.description}} />
          </Card>

          <div>
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            <div className="pt-5">
              {tab === 'conversation' && <Conversation ticketId={t.id} comments={comments} canInternal={canManage} />}
              {tab === 'activity' && <ActivityTimeline logs={logs} />}
              {tab === 'attachments' && <Attachments ticketId={t.id} />}
              {tab === 'time' && <TimeTracking ticketId={t.id} canLog={canManage} />}
              {tab === 'related' && <RelatedTickets ticketId={t.id} relatedTo={relatedTo} relatedFrom={relatedFrom} canManage={canManage} />}
            </div>
          </div>
        </section>

        <aside>
          <Card className="sticky top-20 p-5">
            <h3 className="mb-4 font-bold">Properties</h3>
            <PropertiesPanel ticket={t} canManage={canManage} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Meta({icon: Icon, label, value}: {icon: typeof User; label: string; value: string}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium text-foreground">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
