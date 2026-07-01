'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ClipboardList, Pencil, Plus, Send, Trash2} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Textarea} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {useToast} from '@/components/ui/toast';

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  deliveryHours?: number | null;
  cost?: number | null;
  fulfillmentTeam?: string | null;
};

const emptyForm = {name: '', category: '', description: '', deliveryHours: '', cost: '', fulfillmentTeam: ''};

export function CatalogList() {
  const router = useRouter();
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const canManage = ['ADMIN', 'AGENT'].includes((useSession().data?.user as {role?: string} | undefined)?.role ?? '');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const {data, isLoading} = useQuery({queryKey: ['catalog'], queryFn: () => apiGet<{items: CatalogItem[]}>('/api/catalog')});
  const items = data?.items ?? [];
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['catalog']});

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };
  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      deliveryHours: item.deliveryHours?.toString() ?? '',
      cost: item.cost?.toString() ?? '',
      fulfillmentTeam: item.fulfillmentTeam ?? '',
    });
    setShowForm(true);
  };

  const request = useMutation({
    mutationFn: (item: CatalogItem) =>
      apiSend<{id: string}>('/api/tickets', 'POST', {
        title: `Service request: ${item.name}`,
        description: `Catalog request for "${item.name}".\n\n${item.description}`,
        category: item.category,
        priority: 'MEDIUM',
        source: 'CATALOG',
      }),
    onSuccess: (ticket) => {
      toast({tone: 'success', title: 'Request submitted', description: `Ticket ${ticket.id} created`});
      router.push(`/tickets/${ticket.id}`);
    },
    onError: (err) => toast({tone: 'error', title: 'Request failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        formSchema: {},
        fulfillmentTeam: form.fulfillmentTeam || undefined,
        deliveryHours: form.deliveryHours ? Number(form.deliveryHours) : null,
        cost: form.cost ? Number(form.cost) : null,
      };
      return editingId ? apiSend(`/api/catalog/${editingId}`, 'PATCH', payload) : apiSend('/api/catalog', 'POST', payload);
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      invalidate();
      toast({tone: 'success', title: editingId ? 'Service updated' : 'Service published'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/api/catalog/${id}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Service removed'});
    },
    onError: (err) => toast({tone: 'error', title: 'Remove failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-600 p-8 text-white">
        <div>
          <h1 className="text-3xl font-bold">Service Catalog</h1>
          <p className="mt-1 text-blue-100">Request approved IT services through guided fulfillment workflows.</p>
        </div>
        {canManage && (
          <Button variant="secondary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">{editingId ? 'Edit service' : 'Publish a service'}</h2>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length >= 3 && form.category.trim().length >= 2 && form.description.trim().length >= 10) save.mutate();
            }}
          >
            <label className="text-sm">
              <span className="font-semibold">Name</span>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Category</span>
              <Input className="mt-1" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-semibold">Description</span>
              <Textarea className="mt-1 min-h-16" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Delivery hours</span>
              <Input type="number" min={1} className="mt-1" value={form.deliveryHours} onChange={(e) => setForm({...form, deliveryHours: e.target.value})} />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Cost (INR)</span>
              <Input type="number" min={0} className="mt-1" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-semibold">Fulfillment team</span>
              <Input className="mt-1" value={form.fulfillmentTeam} onChange={(e) => setForm({...form, fulfillmentTeam: e.target.value})} />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={save.isPending}>
                {editingId ? 'Save changes' : 'Publish'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 3}).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No services published</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <Badge tone="info">{item.category}</Badge>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => window.confirm(`Remove "${item.name}" from the catalog?`) && remove.mutate(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <h2 className="my-2 text-lg font-bold">{item.name}</h2>
              <p className="flex-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{__html: item.description}} />
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <span>{item.deliveryHours ? `${item.deliveryHours}h target` : 'Custom target'}</span>
                <span>{item.cost ? `INR ${item.cost}` : 'No charge'}</span>
              </div>
              <Button className="mt-4 w-full" loading={request.isPending} onClick={() => request.mutate(item)}>
                <Send className="h-4 w-4" /> Request service
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
