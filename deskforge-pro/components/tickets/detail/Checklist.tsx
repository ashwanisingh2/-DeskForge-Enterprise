'use client';
import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {CheckSquare, Plus, Square, Trash2} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import {cn} from '@/lib/utils';

type Item = {id: string; text: string; done: boolean};

function normalize(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x: any) => ({id: String(x?.id ?? Date.now() + Math.random()), text: String(x?.text ?? ''), done: Boolean(x?.done)}))
    .filter((x) => x.text);
}

export function Checklist({ticketId, initial, canManage}: {ticketId: string; initial: unknown; canManage: boolean}) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>(() => normalize(initial));
  const [text, setText] = useState('');

  const save = useMutation({
    mutationFn: (next: Item[]) => apiSend(`/api/tickets/${ticketId}`, 'PATCH', {checklist: next}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['ticket', ticketId]}),
    onError: (err) => toast({tone: 'error', title: 'Could not save checklist', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const persist = (next: Item[]) => {
    setItems(next);
    save.mutate(next);
  };

  const add = () => {
    if (!text.trim()) return;
    persist([...items, {id: `${Date.now()}`, text: text.trim(), done: false}]);
    setText('');
  };
  const toggle = (id: string) => persist(items.map((i) => (i.id === id ? {...i, done: !i.done} : i)));
  const remove = (id: string) => persist(items.filter((i) => i.id !== id));

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{done} of {items.length} complete</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{width: `${pct}%`}} />
          </div>
        </div>
      )}

      {items.length === 0 && <p className="text-sm text-muted-foreground">No checklist items yet.</p>}

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50">
            <button
              onClick={() => canManage && toggle(item.id)}
              disabled={!canManage}
              aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
              className={cn('shrink-0', item.done ? 'text-primary' : 'text-muted-foreground', canManage && 'hover:text-primary')}
            >
              {item.done ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
            </button>
            <span className={cn('flex-1 text-sm', item.done && 'text-muted-foreground line-through')}>{item.text}</span>
            {canManage && (
              <button onClick={() => remove(item.id)} aria-label="Remove item" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input placeholder="Add a checklist item…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" size="sm" variant="outline" disabled={!text.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      )}
    </div>
  );
}
