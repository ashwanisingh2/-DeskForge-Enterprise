'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation} from '@tanstack/react-query';
import {ArrowLeft, Save} from 'lucide-react';
import {ApiError, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input, Select, Textarea} from '@/components/ui/input';
import {useToast} from '@/components/ui/toast';
import type {KBArticle} from './KnowledgeBase';

type Props = {initial?: KBArticle};

export function KBEditor({initial}: Props) {
  const router = useRouter();
  const {toast} = useToast();
  const isEdit = Boolean(initial);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    category: initial?.category ?? '',
    status: initial?.status ?? 'published',
    tags: (initial?.tags ?? []).join(', '),
    content: initial?.content ?? '',
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        category: form.category,
        status: form.status,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        content: form.content,
      };
      return isEdit
        ? apiSend<KBArticle>(`/api/kb/${initial!.id}`, 'PATCH', payload)
        : apiSend<KBArticle>('/api/kb', 'POST', payload);
    },
    onSuccess: (article) => {
      toast({tone: 'success', title: isEdit ? 'Article updated' : 'Article published'});
      router.push(`/kb/${article.id}`);
      router.refresh();
    },
    onError: (err) => toast({tone: 'error', title: 'Save failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  const valid = form.title.trim().length >= 4 && form.category.trim().length >= 2 && form.content.trim().length >= 10;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit article' : 'New article'}</h1>
      </div>

      <Card className="p-5">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-semibold">Title</span>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="How to reset your password" required minLength={4} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm sm:col-span-1">
              <span className="font-semibold">Category</span>
              <Input className="mt-1" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="Access" required />
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="font-semibold">Status</span>
              <Select className="mt-1" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </Select>
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="font-semibold">Tags</span>
              <Input className="mt-1" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} placeholder="vpn, remote" />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-semibold">Content</span>
            <Textarea className="mt-1 min-h-72 font-mono text-sm" value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="Write the article. Line breaks are preserved." required />
            <span className="mt-1 block text-xs text-muted-foreground">Content is sanitized on save; basic formatting tags are allowed.</span>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!valid}>
              <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
