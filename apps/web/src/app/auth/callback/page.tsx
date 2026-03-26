'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { setAccessToken } from '@/lib/axios';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');

    async function handleCallback() {
      if (token) {
        setAccessToken(token);
      }
      // Use silent refresh to restore full auth state from the cookie
      await refreshToken();
      router.push('/');
    }

    handleCallback();
  }, [searchParams, refreshToken, router]);

  return (
    <div className="font-body min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="inline-block w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface-variant font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
