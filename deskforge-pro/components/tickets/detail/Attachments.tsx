'use client';
import {useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Download, FileUp, Paperclip} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Button} from '@/components/ui/button';
import {useToast} from '@/components/ui/toast';

type Attachment = {id: string; filename: string; contentType: string; size: number; createdAt: string; downloadUrl?: string};

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = '.png,.jpg,.jpeg,.webp,.pdf,.txt,.zip,.docx';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Attachments({ticketId}: {ticketId: string}) {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const {data, isLoading} = useQuery({
    queryKey: ['attachments', ticketId],
    queryFn: () => apiGet<{attachments: Attachment[]}>(`/api/tickets/${ticketId}/attachments`),
  });
  const attachments = data?.attachments ?? [];

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BYTES) throw new Error('File exceeds 25 MB limit');
      setProgress('Requesting upload…');
      const presign = await apiSend<{key: string; uploadUrl: string}>('/api/uploads/presign', 'POST', {
        ticketId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      });
      setProgress('Uploading…');
      const put = await fetch(presign.uploadUrl, {method: 'PUT', headers: {'content-type': file.type || 'application/octet-stream'}, body: file});
      if (!put.ok) throw new Error('Upload to storage failed');
      setProgress('Finalising…');
      await apiSend(`/api/tickets/${ticketId}/attachments`, 'POST', {
        key: presign.key,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['attachments', ticketId]});
      queryClient.invalidateQueries({queryKey: ['ticket', ticketId]});
      toast({tone: 'success', title: 'File attached'});
    },
    onError: (err) => toast({tone: 'error', title: 'Upload failed', description: err instanceof ApiError ? err.message : (err as Error).message}),
    onSettled: () => {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />
        <Button variant="outline" size="sm" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
          <FileUp className="h-4 w-4" /> Attach file
        </Button>
        {progress && <span className="text-sm text-muted-foreground">{progress}</span>}
        <span className="ml-auto text-xs text-muted-foreground">Max 25 MB · images, PDF, docx, zip, txt</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(a.size)} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              {a.downloadUrl && (
                <a href={a.downloadUrl} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" /> Download
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
