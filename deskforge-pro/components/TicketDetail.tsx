'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {Avatar, Tabs, type TabItem} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {PriorityBadge, StatusBadge} from '@/components/ui/badge';
import {Conversation} from '@/components/tickets/detail/Conversation';
import {ActivityTimeline} from '@/components/tickets/detail/ActivityTimeline';
import {Attachments} from '@/components/tickets/detail/Attachments';
import {TimeTracking} from '@/components/tickets/detail/TimeTracking';
import {RelatedTickets} from '@/components/tickets/detail/RelatedTickets';
import {PropertiesPanel} from '@/components/tickets/detail/PropertiesPanel';

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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="font-mono font-bold text-primary">{t.id}</span>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          <StatusBadge value={t.status} />
          <PriorityBadge value={t.priority} />
        </div>
      </div>

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
