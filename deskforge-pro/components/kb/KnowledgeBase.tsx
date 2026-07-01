'use client';
import {useMemo, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useQuery} from '@tanstack/react-query';
import {Eye, FileText, Plus, Search, ThumbsUp} from 'lucide-react';
import {apiGet} from '@/lib/api-client';
import {useDebounce} from '@/lib/hooks/use-debounce';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input, Select} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';

export type KBArticle = {
  id: string;
  title: string;
  category: string;
  status: string;
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  tags: string[];
  content: string;
  updatedAt: string;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function KnowledgeBase() {
  const {data: session} = useSession();
  const role = (session?.user as {role?: string} | undefined)?.role;
  const canWrite = role === 'ADMIN' || role === 'AGENT';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debounced = useDebounce(search);

  const params = new URLSearchParams();
  if (debounced) params.set('search', debounced);
  if (category) params.set('category', category);

  const {data, isLoading} = useQuery({
    queryKey: ['kb', debounced, category],
    queryFn: () => apiGet<{articles: KBArticle[]}>(`/api/kb?${params.toString()}`),
  });

  const articles = data?.articles ?? [];
  const categories = useMemo(() => Array.from(new Set(articles.map((a) => a.category))).sort(), [articles]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Reusable support articles and fixes.</p>
        </div>
        {canWrite && (
          <Link href="/kb/new">
            <Button>
              <Plus className="h-4 w-4" /> New article
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search articles" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 6}).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No articles found</p>
          <p className="text-sm text-muted-foreground">Adjust your search or create the first article.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/kb/${a.id}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/50">
                <div className="flex items-center gap-2">
                  <Badge tone="info">{a.category}</Badge>
                  {a.status === 'draft' && <Badge tone="warning">Draft</Badge>}
                </div>
                <h2 className="my-2 text-lg font-bold group-hover:text-primary">{a.title}</h2>
                <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{stripHtml(a.content)}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {a.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> {a.helpfulYes}
                  </span>
                  <span className={cn('ml-auto')}>{new Date(a.updatedAt).toLocaleDateString()}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
