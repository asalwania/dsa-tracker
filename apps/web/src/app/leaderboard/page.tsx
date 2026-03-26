'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { TopNav } from '@/components/TopNav';
import { getLeaderboard } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { LeaderboardEntry } from '@/types';

type SortBy = 'totalSolved' | 'currentStreak';

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-xl' : size === 'md' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm';
  if (avatar) {
    return <img src={avatar} alt={name} className={cn('rounded-full object-cover', sizeClass)} />;
  }
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-primary/20 font-bold text-primary', sizeClass)}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const MEDAL = {
  1: { label: '🥇', ring: 'ring-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-500', height: 'h-36' },
  2: { label: '🥈', ring: 'ring-slate-400', bg: 'bg-slate-400/10', text: 'text-slate-400', height: 'h-28' },
  3: { label: '🥉', ring: 'ring-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400', height: 'h-24' },
} as const;

function PodiumCard({ entry, sortBy }: { entry: LeaderboardEntry; sortBy: SortBy }) {
  const medal = MEDAL[entry.rank as 1 | 2 | 3];
  const score = sortBy === 'totalSolved' ? entry.totalSolved : entry.currentStreak;
  const scoreLabel = sortBy === 'totalSolved' ? 'solved' : 'day streak';

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-end gap-2 rounded-2xl border border-outline-variant px-4 py-5 transition-transform hover:-translate-y-0.5',
        medal.bg,
        entry.rank === 1 && 'scale-105',
      )}
    >
      <span className="text-3xl leading-none">{medal.label}</span>
      <div className={cn('ring-2 rounded-full', medal.ring)}>
        <Avatar name={entry.name} avatar={entry.avatar} size={entry.rank === 1 ? 'lg' : 'md'} />
      </div>
      <p className={cn('text-center text-sm font-bold', entry.rank === 1 ? 'text-base' : '')}>{entry.name}</p>
      <p className={cn('font-headline text-2xl font-extrabold', medal.text)}>{score}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">{scoreLabel}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded bg-surface-container-highest" />
        </td>
      ))}
    </tr>
  );
}

export default function LeaderboardPage(): React.ReactElement {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortBy>('totalSolved');

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['leaderboard', sortBy],
    queryFn: () => getLeaderboard(sortBy).then((r) => r.data.data),
    enabled: !!user,
  });

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav activeHref="/leaderboard" />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-8 md:px-8 md:pt-28 md:pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Rankings</p>
            <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight md:text-4xl">
              🏆 Leaderboard
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">Top 50 users ranked by activity</p>
          </div>

          {/* Sort tabs */}
          <div className="flex rounded-xl border border-outline-variant bg-surface-container-low p-1">
            <button
              onClick={() => setSortBy('totalSolved')}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                sortBy === 'totalSolved' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Most Solved
            </button>
            <button
              onClick={() => setSortBy('currentStreak')}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                sortBy === 'currentStreak' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Longest Streak
            </button>
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-6 py-5 text-sm text-error">
            Failed to load leaderboard. Please try again.
          </div>
        )}

        {/* Podium — top 3 */}
        {!isLoading && !isError && top3.length > 0 && (
          <div className="mb-8 flex items-end gap-3">
            {podiumOrder.map((entry) => (
              <PodiumCard key={entry.userId} entry={entry} sortBy={sortBy} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="mb-8 flex items-end gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 animate-pulse rounded-2xl bg-surface-container-highest',
                  i === 1 ? 'h-44' : 'h-36',
                )}
              />
            ))}
          </div>
        )}

        {/* Table — ranks 4–50 */}
        {!isError && (
          <div className="overflow-hidden rounded-2xl border border-outline-variant">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-on-surface-variant">User</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">Total Solved</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">Current Streak</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">Longest Streak</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : rest.map((entry, idx) => {
                      const isMe = user?.id === entry.userId;
                      return (
                        <tr
                          key={entry.userId}
                          style={{ animationDelay: `${idx * 40}ms` }}
                          className={cn(
                            'border-b border-outline-variant/50 transition-colors last:border-0 hover:bg-surface-container-low',
                            'animate-[fadeIn_0.3s_ease_both]',
                            isMe && 'ring-1 ring-inset ring-primary/40 bg-primary/5',
                          )}
                        >
                          <td className="px-4 py-3.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center text-sm font-semibold text-on-surface-variant">
                              {entry.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={entry.name} avatar={entry.avatar} size="sm" />
                              <span className="font-semibold">{entry.name}</span>
                              {isMe && (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-primary">
                            {entry.totalSolved}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-secondary">
                              🔥 {entry.currentStreak}d
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-sm text-on-surface-variant">
                            {entry.longestStreak}d
                          </td>
                        </tr>
                      );
                    })}

                {!isLoading && entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-on-surface-variant">
                      No leaderboard data yet. Start solving problems!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
