'use client';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Pencil, Plus, Trash2, X} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';

type Canned = {id: string; title: string; content: string; category?: string | null};

const emptyForm = {title: '', content: '', category: ''};

export function CannedResponsesEditor() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['canned']});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {data} = useQuery({queryKey: ['canned'], queryFn: () => apiGet<{responses: Canned[]}>('/api/settings/canned')});
  const responses = data?.responses ?? [];

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {title: form.title, content: form.content, category: form.category || undefined};
      return editingId ? apiSend('/api/settings/canned', 'PATCH', {id: editingId, ...payload}) : apiSend('/api/settings/canned', 'POST', payload);
    },
    onSuccess: () => {
      reset();
      invalidate();
      toast({tone: 'success', title: editingId ? 'Response updated' : 'Response saved'});
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/api/settings/canned?id=${id}`, 'DELETE'),
    onSuccess: () => {
      invalidate();
      toast({tone: 'success', title: 'Response removed'});
    },
    onError: (err) => toast({tone: 'error', title: 'Remove failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <Card className="p-5 lg:col-span-2">
      <h2 className="mb-4 text-xl font-bold">Canned responses</h2>
      <form
        className="mb-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title.trim().length >= 2 && form.content.trim().length >= 2) save.mutate();
        }}
      >
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
        <Input placeholder="Category (optional)" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
        <Textarea className="min-h-16 sm:col-span-2" placeholder="Response content" value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} required />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" variant={editingId ? 'primary' : 'outline'} loading={save.isPending}>
            {editingId ? <><Pencil className="h-4 w-4" /> Update</> : <><Plus className="h-4 w-4" /> Add response</>}
          </Button>
          {editingId && (
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </form>

      {responses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No canned responses yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {responses.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <b className="text-sm">{r.title}</b>
                {r.category && <span className="ml-2 text-xs text-muted-foreground">{r.category}</span>}
                <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{__html: r.content}} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {setEditingId(r.id); setForm({title: r.title, content: r.content, category: r.category ?? ''}); window.scrollTo({top: 0, behavior: 'smooth'});}}
                  aria-label="Edit"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(r.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
