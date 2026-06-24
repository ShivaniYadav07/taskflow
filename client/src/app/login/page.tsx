import type { Metadata } from 'next';
import { CheckSquare } from 'lucide-react';
import { LoginForm } from '@/components/forms/login-form';

export const metadata: Metadata = { title: 'Sign in — TaskFlow' };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Decorative blur orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-500/50 ring-1 ring-white/15">
            <CheckSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">TaskFlow</h1>
          <p className="mt-2 text-sm text-slate-400">Welcome back — sign in to continue</p>
        </div>

        {/* White card — keeps all form styles intact */}
        <div className="rounded-2xl bg-white p-7 shadow-2xl shadow-black/40">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
