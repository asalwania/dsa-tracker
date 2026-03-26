'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Home page placeholder.
 * Displays a simple landing message until the full UI is implemented.
 */
export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold tracking-tight">DSA Sheet Tracker</h1>
      <p className="mb-8 text-lg text-gray-600">
        Track your Data Structures & Algorithms practice progress.
      </p>
      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={isLoggingOut}
        className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </main>
  );
}
