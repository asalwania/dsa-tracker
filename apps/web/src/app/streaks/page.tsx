'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { TopNav } from '@/components/TopNav';
import { getMyStreak, getMyProgress } from '@/lib/api';
import { cn } from '@/lib/cn';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildCalendarDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  // 84 days = 12 weeks, go back 83 days
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function getCellColor(count: number): string {
  if (count === 0) return 'bg-surface-container-highest';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/60';
  return 'bg-primary';
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-outline-variant bg-surface-container-low px-6 py-4">
      <span className="text-2xl font-extrabold font-headline text-on-surface">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</span>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-container-highest', className)} />;
}

export default function StreaksPage(): React.ReactElement {
  const { user } = useAuth();

  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['streaks'],
    queryFn: () => getMyStreak().then((r) => r.data.data),
    enabled: !!user,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => getMyProgress().then((r) => r.data.data),
    enabled: !!user,
  });

  const calendarDays = useMemo(() => buildCalendarDays(), []);

  const activityMap = useMemo<Record<string, number>>(() => {
    if (!progressData) return {};
    const map: Record<string, number> = {};
    for (const p of progressData) {
      if (p.completed && p.completedAt) {
        const day = p.completedAt.slice(0, 10);
        map[day] = (map[day] ?? 0) + 1;
      }
    }
    return map;
  }, [progressData]);

  // Build columns (each column = 1 week, Sun→Sat)
  // Pad start so first day lands on correct weekday
  const paddedDays = useMemo(() => {
    const firstDay = calendarDays[0];
    const startDow = firstDay.getDay(); // 0=Sun
    const padded: (Date | null)[] = Array(startDow).fill(null);
    return padded.concat(calendarDays);
  }, [calendarDays]);

  const weeks = useMemo(() => {
    const cols: (Date | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      cols.push(paddedDays.slice(i, i + 7));
    }
    return cols;
  }, [paddedDays]);

  // Month labels: find which week each month first appears in
  const monthMarkers = useMemo(() => {
    const markers: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstReal = week.find(Boolean) as Date | undefined;
      if (firstReal && firstReal.getMonth() !== lastMonth) {
        lastMonth = firstReal.getMonth();
        markers.push({ weekIdx: wi, label: MONTH_LABELS[lastMonth] });
      }
    });
    return markers;
  }, [weeks]);

  const streak = streakData?.currentStreak ?? 0;
  const isLoading = streakLoading || progressLoading;

  function motivationalMessage(): string {
    if (streak === 0) return 'Start your streak today — solve one problem!';
    if (streak < 7) return `Keep it up! ${streak} day${streak > 1 ? 's' : ''} and counting`;
    return `You're on fire! 🔥 ${streak} day streak`;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav activeHref="/streaks" />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-8 md:px-8 md:pt-28 md:pb-12">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Activity</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight md:text-4xl">
            Your Streaks
          </h1>
        </div>

        {/* Hero — current streak */}
        <div className="mb-6 flex flex-col items-center gap-4 rounded-3xl border border-outline-variant bg-surface-container-low px-8 py-10 text-center">
          {isLoading ? (
            <>
              <SkeletonBlock className="h-20 w-20 rounded-full" />
              <SkeletonBlock className="h-10 w-24" />
              <SkeletonBlock className="h-4 w-32" />
            </>
          ) : (
            <>
              <span
                className={cn(
                  'text-7xl leading-none select-none',
                  streak > 0 && 'animate-[pulse_1.8s_ease-in-out_infinite]',
                )}
              >
                🔥
              </span>
              <div>
                <p className="font-headline text-6xl font-extrabold tracking-tight text-on-surface">
                  {streak}
                </p>
                <p className="mt-1 text-sm font-semibold text-on-surface-variant">day streak</p>
              </div>
            </>
          )}
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {isLoading ? (
            <>
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
            </>
          ) : (
            <>
              <StatCard label="Current Streak" value={streakData?.currentStreak ?? 0} />
              <StatCard label="Longest Streak" value={streakData?.longestStreak ?? 0} />
              <StatCard label="Total Solved" value={streakData?.totalSolved ?? 0} />
            </>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low px-6 py-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            Activity — Last 12 Weeks
          </h2>

          {isLoading ? (
            <div className="flex gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <SkeletonBlock key={j} className="h-3.5 w-3.5 rounded-sm" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-0">
                {/* Day labels column */}
                <div className="mr-1.5 flex flex-col justify-around pt-5">
                  {DAY_LABELS.map((label, i) => (
                    <span key={i} className="h-3.5 text-[9px] font-semibold text-on-surface-variant leading-none">
                      {label}
                    </span>
                  ))}
                </div>

                {/* Weeks grid */}
                <div className="flex flex-col">
                  {/* Month labels row */}
                  <div className="mb-1 flex">
                    {weeks.map((_, wi) => {
                      const marker = monthMarkers.find((m) => m.weekIdx === wi);
                      return (
                        <div key={wi} className="w-5 flex-shrink-0 text-[9px] font-semibold text-on-surface-variant">
                          {marker?.label ?? ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day cells — rotated: rows=weekday, cols=week */}
                  <div className="flex gap-0.5">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((day, di) => {
                          if (!day) return <div key={di} className="h-3.5 w-3.5" />;
                          const ymd = toYMD(day);
                          const count = activityMap[ymd] ?? 0;
                          const label = `${ymd}: ${count} solved`;
                          return (
                            <div
                              key={di}
                              title={label}
                              className={cn(
                                'h-3.5 w-3.5 rounded-sm transition-opacity hover:opacity-75',
                                getCellColor(count),
                              )}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-on-surface-variant">
                <span>Less</span>
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className={cn('h-3 w-3 rounded-sm', getCellColor(n))} />
                ))}
                <span>More</span>
              </div>
            </div>
          )}
        </div>

        {/* Motivational section */}
        {!isLoading && (
          <div
            className={cn(
              'rounded-2xl border px-6 py-5 text-center text-sm font-semibold',
              streak === 0
                ? 'border-outline-variant bg-surface-container-low text-on-surface-variant'
                : streak >= 7
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-secondary/30 bg-secondary/10 text-secondary',
            )}
          >
            {motivationalMessage()}
          </div>
        )}
      </main>
    </div>
  );
}
