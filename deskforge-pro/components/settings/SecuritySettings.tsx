'use client';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {signOut} from 'next-auth/react';
import {LogOut, Monitor, ShieldCheck} from 'lucide-react';
import {ApiError, apiGet, apiSend} from '@/lib/api-client';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useToast} from '@/components/ui/toast';

type Session = {id: string; createdAt: string; expiresAt: string; deviceInfo?: string | null};

export function SecuritySettings() {
  const {toast} = useToast();
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({queryKey: ['auth-sessions'], queryFn: () => apiGet<{sessions: Session[]}>('/api/auth/sessions')});
  const sessions = data?.sessions ?? [];

  const logoutAll = useMutation({
    mutationFn: () => apiSend('/api/auth/logout-all', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['auth-sessions']});
      toast({tone: 'success', title: 'Signed out of all devices'});
      setTimeout(() => signOut({callbackUrl: '/login'}), 800);
    },
    onError: (err) => toast({tone: 'error', title: 'Failed', description: err instanceof ApiError ? err.message : 'Error'}),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">Manage your active sessions and account security.</p>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Monitor className="h-4 w-4" /> Active sessions
          </h2>
          <Button variant="destructive" size="sm" loading={logoutAll.isPending} onClick={() => window.confirm('Sign out of all devices? You will need to log in again.') && logoutAll.mutate()}>
            <LogOut className="h-4 w-4" /> Sign out all devices
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3 text-sm">
                <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.deviceInfo || 'Unknown device'}</p>
                  <p className="text-xs text-muted-foreground">
                    Started {new Date(s.createdAt).toLocaleString()} · expires {new Date(s.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div className="text-sm">
          <p className="font-semibold">Session policy</p>
          <p className="text-muted-foreground">
            30-minute idle timeout (rolls forward on activity), 15-minute access tokens with rotating refresh tokens, and a maximum of 3 concurrent devices per account.
          </p>
        </div>
      </Card>
    </div>
  );
}
