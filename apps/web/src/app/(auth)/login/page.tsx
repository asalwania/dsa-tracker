'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { cn } from '@/lib/cn';
import { isAxiosError } from 'axios';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:5000/api';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(data.email, data.password);
      router.push(redirect || '/');
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.error?.message) {
        setSubmitError(err.response.data.error.message);
      } else {
        const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
        setSubmitError(message);
      }
    }
  };

  return (
    <div className="font-body min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(70,72,212,0.06)]">
        {/* Left Side: Editorial Content & Illustration */}
        <div className="hidden md:flex flex-col justify-between p-12 brand-gradient text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.36 18.78L6.61 18l.6-2.08h5.58l.6 2.08.25.78h2.65L11.92 5.22h-2.84L4.71 18.78H6.36zM9.5 7.74L12.12 14H7.87L9.5 7.74zM20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14z" />
              </svg>
              <span className="font-headline font-extrabold text-2xl tracking-tighter">
                DSA Architect
              </span>
            </div>

            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              Master the <br />
              logic of code.
            </h1>
            <p className="text-primary-fixed-dim text-lg max-w-xs font-medium leading-relaxed">
              Join the editorial learning platform designed for high-performance software
              engineering.
            </p>
          </div>

          {/* Illustration Placeholder */}
          <div className="relative z-10 mt-auto">
            <div className="aspect-square w-full max-w-sm mx-auto bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 p-6 flex items-center justify-center">
              <svg
                className="w-32 h-32 text-white/30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          {/* Decorative Shape */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">
                Welcome Back
              </h2>
              <p className="text-on-surface-variant font-medium">
                Please enter your details to continue your journey.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Submit Error */}
              {submitError && (
                <div className="bg-error-container text-on-error-container text-sm font-semibold px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                >
                  Email
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="architect@code.io"
                    autoComplete="email"
                    {...register('email')}
                    className={cn(
                      'w-full px-4 py-3 bg-surface-container-low border-none rounded-lg',
                      'focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200',
                      'text-on-surface border-b-2 border-transparent focus:border-primary',
                      'placeholder:text-outline-variant',
                      errors.email && 'border-error focus:border-error',
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-bold text-primary hover:text-primary-container transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={cn(
                      'w-full px-4 py-3 bg-surface-container-low border-none rounded-lg',
                      'focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200',
                      'text-on-surface border-b-2 border-transparent focus:border-primary',
                      'placeholder:text-outline-variant',
                      errors.password && 'border-error focus:border-error',
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-error text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full brand-gradient text-white font-bold py-4 rounded-xl',
                  'flex items-center justify-center gap-3',
                  'active:scale-[0.98] transition-all duration-200',
                  'shadow-lg shadow-primary/20',
                  'disabled:opacity-70 disabled:cursor-not-allowed',
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-container-high" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-outline-variant">
                  <span className="bg-surface-container-lowest px-4">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${API_URL}/auth/google`;
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-3 px-4 py-3',
                  'bg-surface-container-lowest border border-outline-variant/30 rounded-xl',
                  'hover:bg-surface-container-low transition-colors duration-200',
                  'text-on-surface font-bold active:scale-[0.98]',
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-on-surface-variant font-medium">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary font-bold hover:underline underline-offset-4 decoration-2"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-container-lowest" />}>
      <LoginContent />
    </Suspense>
  );
}
