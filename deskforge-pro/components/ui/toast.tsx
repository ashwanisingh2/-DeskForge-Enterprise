'use client';
import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {CheckCircle2, Info, XCircle} from 'lucide-react';
import {cn} from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';
type Toast = {id: number; title: string; description?: string; tone: ToastTone};

type ToastContextValue = {
  toast: (t: {title: string; description?: string; tone?: ToastTone}) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastTone, typeof Info> = {success: CheckCircle2, error: XCircle, info: Info};
const toneClasses: Record<ToastTone, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastContextValue['toast']>(
    ({title, description, tone = 'info'}) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, {id, title, description, tone}]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({toast}), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{opacity: 0, y: 16, scale: 0.96}}
                animate={{opacity: 1, y: 0, scale: 1}}
                exit={{opacity: 0, x: 24}}
                transition={{duration: 0.18}}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
                role="status"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', toneClasses[t.tone])} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
