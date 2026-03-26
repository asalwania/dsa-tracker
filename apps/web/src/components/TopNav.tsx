'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';

const NAV_TABS = [
  { label: 'Curriculum', href: '/' },
  { label: 'Streaks', href: '/streaks' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Mock Tests', href: '/mock-tests' },
  { label: 'Community', href: '/community' },
];

type Theme = 'light' | 'dark';

interface TopNavProps {
  activeHref: string;
  showSearch?: boolean;
  searchTerm?: string;
  onSearch?: (value: string) => void;
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopNav({ activeHref, showSearch = false, searchTerm = '', onSearch }: TopNavProps): React.ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>('light');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const first = user?.name?.trim().charAt(0);
    return first ? first.toUpperCase() : 'U';
  }, [user?.name]);

  // Sync theme from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const handleThemeToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('theme', next);
  };

  // Close profile menu on outside click / Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsProfileMenuOpen(false);
    setIsLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-surface-container-low/85 px-4 shadow-[0_20px_40px_rgba(99,102,241,0.06)] backdrop-blur-md md:px-6">
      {/* Left: brand + tabs */}
      <div className="flex items-center gap-4 md:gap-8">
        <Link
          href="/"
          className="font-headline text-lg font-extrabold tracking-tight text-on-surface md:text-xl"
        >
          DSA Architect
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'py-5 font-headline text-sm font-bold tracking-tight transition-colors',
                tab.href === activeHref
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: search (optional) + theme + profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {showSearch && (
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 md:flex">
            <SearchIcon className="h-4 w-4 text-outline" />
            <input
              type="text"
              className="w-32 border-none bg-transparent text-sm text-on-surface outline-none placeholder:text-outline lg:w-48"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleThemeToggle}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary active:scale-95"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </button>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-1 py-1 pr-2 transition-all hover:border-primary"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            aria-label="Open profile menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ? `${user.name} avatar` : 'User avatar'}
                className="h-8 w-8 rounded-full border border-outline-variant object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-primary-fixed text-xs font-bold text-on-primary-fixed">
                {userInitial}
              </div>
            )}
            <ChevronIcon
              className={cn(
                'h-4 w-4 text-on-surface-variant transition-transform',
                isProfileMenuOpen && 'rotate-180',
              )}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_20px_45px_rgba(15,23,42,0.16)]">
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Profile
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name ? `${user.name} avatar` : 'User avatar'}
                      className="h-12 w-12 rounded-full border border-outline-variant object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-primary-fixed text-sm font-bold text-on-primary-fixed">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-headline text-sm font-bold text-on-surface">
                      {user?.name ?? 'User'}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {user?.email ?? 'No email found'}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface">
                      {user?.role ?? 'user'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-outline-variant p-3">
                <button
                  type="button"
                  onClick={() => { void handleLogout(); }}
                  disabled={isLoggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogoutIcon className="h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
