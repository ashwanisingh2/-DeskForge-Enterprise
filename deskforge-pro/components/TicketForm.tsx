'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation} from '@tanstack/react-query';
import {ArrowLeft, Send, Sparkles} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Select, Textarea} from '@/components/ui/input';
import {PriorityBadge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/toast';

const SUBCATEGORIES: Record<string, string[]> = {
  Hardware: ['Laptop', 'Desktop', 'Monitor', 'Keyboard/Mouse', 'Headset'],
  Software: ['Microsoft Office', 'Antivirus', 'ERP/SAP', 'Custom App', 'OS'],
  Network: ['WiFi', 'VPN', 'Internet', 'LAN/Ethernet', 'Firewall'],
  'Access & Permissions': ['New Account', 'Password Reset', 'Permission Change', 'Account Locked'],
  Email: ['Outlook Setup', 'Email not sending', 'Spam', 'Distribution List'],
  Printer: ['Offline', 'Paper Jam', 'Driver Issue', 'Network Printer'],
};
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const IMPACTS = ['Individual', 'Department', 'Company-wide'] as const;
const URGENCIES = ['Low', 'Medium', 'High'] as const;

export function TicketForm() {
  const router = useRouter();
  const {toast} = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Hardware',
    subcategory: 'Laptop',
    priority: 'MEDIUM',
    impact: 'Individual',
    urgency: 'Medium',
    source: 'Web Portal',
    tags: [] as string[],
  });
  const set = (k: string, v: any) => setForm((f) => ({...f, [k]: v}));

  const create = useMutation({
    mutationFn: () => apiSend<{id: string}>('/api/tickets', 'POST', form),
    onSuccess: (t) => {
      toast({tone: 'success', title: 'Ticket created', description: t.id});
      router.push(`/tickets/${t.id}`);
    },
    onError: (err) => toast({tone: 'error', title: 'Could not create ticket', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const valid = form.title.trim().length >= 4 && form.description.trim().length >= 10;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New ticket</h1>
          <p className="text-sm text-muted-foreground">Log a new incident or service request.</p>
        </div>
      </div>

      <form
        className="grid gap-5 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate();
        }}
      >
        <Card className="space-y-4 p-6 lg:col-span-2">
          <label className="block text-sm">
            <span className="font-semibold">Subject</span>
            <Input className="mt-1.5" required minLength={4} maxLength={150} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Brief summary of the issue" />
          </label>

          <label className="block text-sm">
            <span className="font-semibold">Description</span>
            <Textarea className="mt-1.5 min-h-56" required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the issue in detail — steps, error messages, when it started…" />
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Tip: more detail helps faster resolution
            </span>
          </label>

          <label className="block text-sm">
            <span className="font-semibold">Tags</span>
            <Input className="mt-1.5" placeholder="vpn, remote, urgent (comma separated)" onChange={(e) => set('tags', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} />
          </label>
        </Card>

        <aside className="space-y-4">
          <Card className="space-y-4 p-6">
            <div>
              <label className="text-sm font-semibold">Priority</label>
              <Select className="mt-1.5" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <div className="mt-2"><PriorityBadge value={form.priority as never} /></div>
            </div>

            <div>
              <label className="text-sm font-semibold">Category</label>
              <Select className="mt-1.5" value={form.category} onChange={(e) => setForm((f) => ({...f, category: e.target.value, subcategory: SUBCATEGORIES[e.target.value]?.[0] ?? ''}))}>
                {Object.keys(SUBCATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Subcategory</label>
              <Select className="mt-1.5" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)}>
                {(SUBCATEGORIES[form.category] ?? []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Impact</label>
                <Select className="mt-1.5" value={form.impact} onChange={(e) => set('impact', e.target.value)}>
                  {IMPACTS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold">Urgency</label>
                <Select className="mt-1.5" value={form.urgency} onChange={(e) => set('urgency', e.target.value)}>
                  {URGENCIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Button type="submit" className="w-full" loading={create.isPending} disabled={!valid}>
            <Send className="h-4 w-4" /> Create ticket
          </Button>
        </aside>
      </form>
    </div>
  );
}
