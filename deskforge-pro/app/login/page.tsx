'use client';
import {useState} from 'react';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {Eye, EyeOff, LifeBuoy, Lock, Shield, User, Zap} from 'lucide-react';
import {cn} from '@/lib/utils';

const features = [
  {icon: Zap, text: 'AI-powered ticket routing & summarisation'},
  {icon: Shield, text: 'Enterprise RBAC, SSO and audit trails'},
  {icon: LifeBuoy, text: 'SLA automation with business-hour awareness'},
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await signIn('credentials', {username, password, redirect: false});
    setBusy(false);
    if (result?.error) setError('Invalid username or password. Please try again.');
    else router.push('/dashboard');
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden md:grid-cols-[1fr_480px] lg:grid-cols-[1fr_520px]">
      {/* ── Left: hero panel ── */}
      <section className="relative hidden overflow-hidden bg-[#060d1f] md:flex md:flex-col md:justify-between md:p-14">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg">
            <LifeBuoy className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">DeskForge Pro</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <h1 className="max-w-lg text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            Support,<br />
            <span className="bg-gradient-to-r from-sky-300 to-violet-400 bg-clip-text text-transparent">
              forged for momentum.
            </span>
          </h1>
          <p className="max-w-md text-lg text-slate-400">
            Enterprise incidents, requests, knowledge and service intelligence — one calm workspace.
          </p>

          <ul className="space-y-3">
            {features.map(({icon: Icon, text}) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-sky-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
          <span className="pulse-dot" aria-hidden />
          Enterprise Edition — WCAG 2.1 AA compliant
        </div>
      </section>

      {/* ── Right: login form ── */}
      <section className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[400px] animate-in-up">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500">
              <LifeBuoy className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-extrabold">DeskForge Pro</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight">Sign in</h2>
          <p className="mt-1 text-muted-foreground">Access your service workspace</p>

          <form onSubmit={submit} className="mt-8 space-y-4" aria-label="Sign in form">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-semibold">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="username"
                  className={cn('input pl-9', error && 'border-destructive/60 focus:ring-destructive/20')}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className={cn('input pl-9 pr-10', error && 'border-destructive/60 focus:ring-destructive/20')}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p id="login-error" role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <Lock className="h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn w-full py-2.5 text-sm">
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                  Signing in…
                </>
              ) : (
                'Sign in securely'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
            <p className="font-semibold text-muted-foreground">Demo credentials</p>
            <div className="mt-1 flex gap-4 font-mono text-xs text-foreground/70">
              <span>admin / admin123</span>
              <span>·</span>
              <span>agent1 / agent123</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
