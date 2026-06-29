'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { getAxiosError } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setFormError('');
    try {
      const res = await authService.login(data);
      const { user } = res.data.data;
      login(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (err) {
      const msg = getAxiosError(err, 'Invalid email or password');
      setFormError(msg);
      toast.error(msg);
    }
  };

  const eyeButton = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword((v) => !v)}
      className="text-slate-400 hover:text-slate-600 transition-colors"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Inline error alert — visible before the user sees the toast */}
      {formError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 animate-scale-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <Input
        {...register('email')}
        id="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
      />

      <Input
        {...register('password')}
        id="password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        suffix={eyeButton}
      />

      <Button type="submit" isLoading={isSubmitting} size="lg" className="mt-1 w-full gap-1.5">
        Sign in
        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
          Create one
        </Link>
      </p>
    </form>
  );
}
