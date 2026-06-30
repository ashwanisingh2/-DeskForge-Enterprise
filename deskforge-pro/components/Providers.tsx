'use client';
import {useState} from 'react';
import {SessionProvider as AuthProvider} from 'next-auth/react';
import {ThemeProvider} from 'next-themes';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ToastProvider} from '@/components/ui/toast';

export function Providers({children}: {children: React.ReactNode}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {staleTime: 30_000, retry: 1, refetchOnWindowFocus: false},
        },
      }),
  );

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

/** @deprecated Use {@link Providers}. Retained for backward compatibility. */
export const SessionProvider = Providers;
