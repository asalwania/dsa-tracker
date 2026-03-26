'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { cn } from '@/lib/cn';
import type { ApiResponse, Problem, Topic, UserProgress } from '@/types';

type IconName =
  | 'architecture'
  | 'search'
  | 'bell'
  | 'settings'
  | 'moon'
  | 'sun'
  | 'logout'
  | 'tree'
  | 'list'
  | 'layers'
  | 'star'
  | 'system'
  | 'check'
  | 'chart'
  | 'bolt'
  | 'arrays'
  | 'text'
  | 'link'
  | 'chevron'
  | 'spark'
  | 'youtube'
  | 'read'
  | 'code';

interface SidebarItem {
  id: string;
  label: string;
  icon: IconName;
  active?: boolean;
  topicId?: string;
}

interface SummaryCard {
  label: string;
  value: string;
  icon: IconName;
  iconClassName: string;
  accentClassName: string;
}

interface TopicSectionData {
  topic: Topic;
  problems: Problem[];
}

type RawTopic = Omit<Topic, 'id'> & { id?: string; _id?: string };
type RawProblem = Omit<Problem, 'id'> & { id?: string; _id?: string };
type RawProgress = Omit<UserProgress, 'id'> & { id?: string; _id?: string };
type Theme = 'light' | 'dark';

const topTabs = [
  { label: 'Curriculum', href: '/' },
  { label: 'Mock Tests', href: '/mock-tests' },
  { label: 'Community', href: '/community' },
];

const fallbackSidebarItems: SidebarItem[] = [
  { id: 'fallback-1', label: 'Arrays', icon: 'arrays', active: true },
  { id: 'fallback-2', label: 'Strings', icon: 'text' },
  { id: 'fallback-3', label: 'Linked Lists', icon: 'link' },
  { id: 'fallback-4', label: 'Stacks & Queues', icon: 'list' },
  { id: 'fallback-5', label: 'Trees', icon: 'tree' },
  { id: 'fallback-6', label: 'Graphs', icon: 'system' },
  { id: 'fallback-7', label: 'Dynamic Programming', icon: 'layers' },
  { id: 'fallback-8', label: 'Binary Search', icon: 'search' },
  { id: 'fallback-9', label: 'Greedy Algorithms', icon: 'bolt' },
  { id: 'fallback-10', label: 'Backtracking', icon: 'star' },
];

function resolveEntityId(entity: { id?: string; _id?: string }, entityName: string): string {
  const resolvedId = entity.id ?? entity._id;
  if (!resolvedId) {
    throw new Error(`${entityName} id is missing in API response`);
  }
  return resolvedId;
}

function normalizeTopic(raw: RawTopic): Topic {
  return {
    id: resolveEntityId(raw, `Topic '${raw.slug ?? 'unknown'}'`),
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    order: raw.order,
    icon: raw.icon,
    totalProblems: raw.totalProblems,
    solvedCount: raw.solvedCount,
  };
}

function normalizeProblem(raw: RawProblem): Problem {
  return {
    id: resolveEntityId(raw, `Problem '${raw.slug ?? raw.title ?? 'unknown'}'`),
    slug: raw.slug,
    title: raw.title,
    topicId: String(raw.topicId),
    difficulty: raw.difficulty,
    tags: raw.tags ?? [],
    platform: raw.platform,
    problemUrl: raw.problemUrl,
    youtubeUrl: raw.youtubeUrl,
    articleUrl: raw.articleUrl,
    companies: raw.companies ?? [],
    order: raw.order,
    isCompleted: raw.isCompleted,
    status: raw.status,
  };
}

function normalizeProgress(raw: RawProgress): UserProgress {
  return {
    id: resolveEntityId(raw, 'Progress entry'),
    userId: String(raw.userId),
    problemId: String(raw.problemId),
    topicId: String(raw.topicId),
    completed: raw.completed,
    status: raw.status,
    notes: raw.notes,
    completedAt: raw.completedAt,
  };
}

function getTopicIcon(slug: string): IconName {
  switch (slug) {
    case 'arrays':
      return 'arrays';
    case 'strings':
      return 'text';
    case 'linked-lists':
      return 'link';
    case 'stacks-queues':
      return 'list';
    case 'trees':
      return 'tree';
    case 'graphs':
      return 'system';
    case 'dynamic-programming':
      return 'layers';
    case 'binary-search':
      return 'search';
    case 'greedy':
      return 'bolt';
    case 'backtracking':
      return 'star';
    default:
      return 'list';
  }
}

function getProgressTone(completionPercent: number): {
  barClassName: string;
  textClassName: string;
} {
  if (completionPercent >= 80) {
    return {
      barClassName: 'bg-green-500',
      textClassName: 'text-green-600',
    };
  }

  if (completionPercent >= 50) {
    return {
      barClassName: 'bg-primary',
      textClassName: 'text-primary',
    };
  }

  if (completionPercent >= 25) {
    return {
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-600',
    };
  }

  return {
    barClassName: 'bg-rose-500',
    textClassName: 'text-rose-600',
  };
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const castError = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
          };
        };
      };
      message?: string;
    };

    return (
      castError.response?.data?.error?.message ??
      castError.message ??
      'Unable to load dashboard data'
    );
  }

  return 'Unable to load dashboard data';
}

function getDifficultyLabel(difficulty: Problem['difficulty']): 'Easy' | 'Medium' | 'Hard' {
  if (difficulty === 'easy') return 'Easy';
  if (difficulty === 'medium') return 'Medium';
  return 'Hard';
}

function problemMatchesSearch(problem: Problem, normalizedSearchTerm: string): boolean {
  return (
    problem.title.toLowerCase().includes(normalizedSearchTerm) ||
    problem.tags.some((tag) => tag.toLowerCase().includes(normalizedSearchTerm))
  );
}

function Icon({ name, className }: { name: IconName; className?: string }): React.ReactElement {
  switch (name) {
    case 'architecture':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M4 18h16M8 18V9l4-3 4 3v9M10 13h4M12 3v3" strokeLinecap="round" />
        </svg>
      );
    case 'search':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          className={className}
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-3.4-3.4" strokeLinecap="round" />
        </svg>
      );
    case 'bell':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M6 9a6 6 0 1 1 12 0v5l1.5 2H4.5L6 14V9zM10 18a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Z" />
          <path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4" />
        </svg>
      );
    case 'moon':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path
            d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'sun':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'logout':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          className={className}
        >
          <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" strokeLinecap="round" />
        </svg>
      );
    case 'tree':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="6" cy="11" r="2" />
          <circle cx="18" cy="11" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M12 7v3M10 17H8M14 17h2M7.4 12.3 10 16M16.6 12.3 14 16M12 10l4 1M12 10l-4 1" />
        </svg>
      );
    case 'list':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M6 7h12M6 12h12M6 17h12" strokeLinecap="round" />
          <circle cx="3.5" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'layers':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M12 4 4 8l8 4 8-4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="m12 3.5 2.75 5.58 6.16.9-4.45 4.33 1.05 6.14L12 17.57 6.49 20.45l1.05-6.14-4.45-4.33 6.16-.9L12 3.5Z" />
        </svg>
      );
    case 'system':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <rect x="4" y="5" width="6" height="6" rx="1" />
          <rect x="14" y="5" width="6" height="6" rx="1" />
          <rect x="9" y="14" width="6" height="6" rx="1" />
          <path d="M10 8h4M12 11v3" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1.2 14.2L6.9 12.3l1.4-1.4 2.5 2.5 4.9-4.9 1.4 1.4Z" />
        </svg>
      );
    case 'chart':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M4 19h16M7 16v-4M12 16V9M17 16v-7" strokeLinecap="round" />
          <rect x="6" y="10" width="2" height="6" rx=".8" fill="currentColor" stroke="none" />
          <rect x="11" y="7" width="2" height="9" rx=".8" fill="currentColor" stroke="none" />
          <rect x="16" y="5" width="2" height="11" rx=".8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M13.5 2 5 13h5l-1.5 9L19 11h-5l-.5-9Z" />
        </svg>
      );
    case 'arrays':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <rect x="4" y="5" width="4" height="14" rx="1" />
          <rect x="10" y="5" width="4" height="14" rx="1" />
          <rect x="16" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case 'text':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M4 6h16M8 6v12M16 12h-8" strokeLinecap="round" />
        </svg>
      );
    case 'link':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path
            d="M10 13.5 8.8 14.7a3.2 3.2 0 0 1-4.5-4.5L7 7.5a3.2 3.2 0 0 1 4.5 0M14 10.5l1.2-1.2a3.2 3.2 0 0 1 4.5 4.5L17 16.5a3.2 3.2 0 0 1-4.5 0M9.3 14.7l5.4-5.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Zm7 12 1 2.3L22 18l-2 .7L19 21l-1-2.3L16 18l2-.7 1-2.3ZM5 14l.8 1.9L8 16.7l-2.2.8L5 19.5l-.8-2L2 16.7l2.2-.8L5 14Z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.6A3 3 0 0 0 2.4 7.2 31 31 0 0 0 1.8 12a31 31 0 0 0 .6 4.8 3 3 0 0 0 2.1 2.1c1.8.6 7.5.6 7.5.6s5.7 0 7.5-.6a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .6-4.8 31 31 0 0 0-.6-4.8ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z" />
        </svg>
      );
    case 'read':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5V6.5Z" />
          <path d="M8 8h8M8 12h8" strokeLinecap="round" />
        </svg>
      );
    case 'code':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" strokeLinecap="round" />
        </svg>
      );
    case 'chevron':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={className}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return <span />;
  }
}

function DifficultyTag({ difficulty }: { difficulty: Problem['difficulty'] }): React.ReactElement {
  const className = cn(
    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
    difficulty === 'easy' && 'bg-green-100 text-green-700',
    difficulty === 'medium' && 'bg-amber-100 text-amber-700',
    difficulty === 'hard' && 'bg-red-100 text-red-700',
  );

  return <span className={className}>{getDifficultyLabel(difficulty)}</span>;
}

/**
 * Main authenticated dashboard page.
 * Uses live topic/problem/progress APIs instead of static mock data.
 */
export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [topicSections, setTopicSections] = useState<TopicSectionData[]>([]);
  const [progressByProblemId, setProgressByProblemId] = useState<Record<string, UserProgress>>({});
  const [updatingProblemIds, setUpdatingProblemIds] = useState<Record<string, boolean>>({});
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [pendingScrollTopicId, setPendingScrollTopicId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const firstCharacter = user?.name?.trim().charAt(0);
    return firstCharacter ? firstCharacter.toUpperCase() : 'U';
  }, [user?.name]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent): void => {
      const targetNode = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(targetNode)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme: Theme = systemPrefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const loadDashboardData = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      const [topicsResponse, progressResponse] = await Promise.all([
        api.get<ApiResponse<RawTopic[]>>('/topics'),
        api.get<ApiResponse<RawProgress[]>>('/progress'),
      ]);

      const topics = topicsResponse.data.data.map(normalizeTopic).sort((a, b) => a.order - b.order);
      const progressEntries = progressResponse.data.data.map(normalizeProgress);

      const nextProgressLookup: Record<string, UserProgress> = {};
      for (const progressEntry of progressEntries) {
        if (!nextProgressLookup[progressEntry.problemId]) {
          nextProgressLookup[progressEntry.problemId] = progressEntry;
        }
      }

      const topicProblems = await Promise.all(
        topics.map(async (topic) => {
          const problemsResponse = await api.get<ApiResponse<RawProblem[]>>(
            `/problems/topic/${topic.id}`,
          );

          const problems = problemsResponse.data.data
            .map(normalizeProblem)
            .sort((a, b) => a.order - b.order);

          return {
            topicId: topic.id,
            problems,
          };
        }),
      );

      const problemsByTopic = new Map<string, Problem[]>(
        topicProblems.map((entry) => [entry.topicId, entry.problems]),
      );

      const nextSections: TopicSectionData[] = topics.map((topic) => ({
        topic,
        problems: problemsByTopic.get(topic.id) ?? [],
      }));

      setTopicSections(nextSections);
      setProgressByProblemId(nextProgressLookup);
      setExpandedTopicId((current) => {
        if (current && nextSections.some((section) => section.topic.id === current)) {
          return current;
        }
        return nextSections[0]?.topic.id ?? null;
      });
    } catch (error) {
      setDashboardError(getApiErrorMessage(error));
    } finally {
      setIsDashboardLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsDashboardLoading(false);
      return;
    }

    void loadDashboardData();
  }, [isLoading, isAuthenticated, loadDashboardData]);

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsProfileMenuOpen(false);
    setIsLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  };

  const allProblems = useMemo(() => {
    return topicSections.flatMap((section) => section.problems);
  }, [topicSections]);

  const topicSectionsWithProgress = useMemo(() => {
    return topicSections.map((section) => {
      const solvedCount = section.problems.reduce((count, problem) => {
        return count + (progressByProblemId[problem.id]?.completed ? 1 : 0);
      }, 0);

      const completionPercent =
        section.problems.length === 0
          ? 0
          : Math.round((solvedCount / section.problems.length) * 100);

      return {
        ...section,
        solvedCount,
        completionPercent,
      };
    });
  }, [progressByProblemId, topicSections]);

  const totalSolved = useMemo(() => {
    return topicSectionsWithProgress.reduce((sum, section) => sum + section.solvedCount, 0);
  }, [topicSectionsWithProgress]);

  const totalProblems = allProblems.length;
  const overallProgressPercent =
    totalProblems === 0 ? 0 : Math.round((totalSolved / totalProblems) * 100);

  const difficultyStats = useMemo(() => {
    const stats = {
      easy: { solved: 0, total: 0 },
      medium: { solved: 0, total: 0 },
      hard: { solved: 0, total: 0 },
    };

    for (const problem of allProblems) {
      stats[problem.difficulty].total += 1;
      if (progressByProblemId[problem.id]?.completed) {
        stats[problem.difficulty].solved += 1;
      }
    }

    return stats;
  }, [allProblems, progressByProblemId]);

  const summaryCards: SummaryCard[] = useMemo(() => {
    return [
      {
        label: 'Easy Problems',
        value: `${difficultyStats.easy.solved} / ${difficultyStats.easy.total}`,
        icon: 'check',
        iconClassName: 'bg-green-50 text-green-600',
        accentClassName: 'border-l-green-500',
      },
      {
        label: 'Medium Problems',
        value: `${difficultyStats.medium.solved} / ${difficultyStats.medium.total}`,
        icon: 'chart',
        iconClassName: 'bg-amber-50 text-amber-600',
        accentClassName: 'border-l-tertiary',
      },
      {
        label: 'Hard Problems',
        value: `${difficultyStats.hard.solved} / ${difficultyStats.hard.total}`,
        icon: 'bolt',
        iconClassName: 'bg-red-50 text-error',
        accentClassName: 'border-l-error',
      },
    ];
  }, [difficultyStats]);

  const sidebarItems = useMemo(() => {
    if (topicSections.length === 0) {
      return fallbackSidebarItems;
    }

    return topicSectionsWithProgress.map((section) => ({
      id: section.topic.id,
      topicId: section.topic.id,
      label: section.topic.title,
      icon: getTopicIcon(section.topic.slug),
      active: section.topic.id === expandedTopicId,
    }));
  }, [expandedTopicId, topicSectionsWithProgress]);

  const resumeProblem = useMemo(() => {
    for (const section of topicSectionsWithProgress) {
      const unsolvedProblem = section.problems.find(
        (problem) => !progressByProblemId[problem.id]?.completed,
      );

      if (unsolvedProblem) {
        return unsolvedProblem;
      }
    }

    return topicSectionsWithProgress[0]?.problems[0] ?? null;
  }, [progressByProblemId, topicSectionsWithProgress]);

  const handleResume = (): void => {
    if (!resumeProblem) return;
    window.open(resumeProblem.problemUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSidebarSelect = (topicId: string): void => {
    setExpandedTopicId(topicId);
    setPendingScrollTopicId(topicId);
  };

  useEffect(() => {
    if (!pendingScrollTopicId) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const sectionElement = document.getElementById(`topic-${pendingScrollTopicId}`);
      if (!sectionElement) {
        setPendingScrollTopicId(null);
        return;
      }

      const navOffset = 88;
      const bottomPadding = 24;
      const maxVisibleBottom = window.innerHeight - bottomPadding;
      const rect = sectionElement.getBoundingClientRect();
      const visibleHeight = maxVisibleBottom - navOffset;

      if (rect.height > visibleHeight) {
        const targetTop = window.scrollY + rect.top - navOffset;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        setPendingScrollTopicId(null);
        return;
      }

      if (rect.top < navOffset) {
        window.scrollBy({ top: rect.top - navOffset, behavior: 'smooth' });
      } else if (rect.bottom > maxVisibleBottom) {
        window.scrollBy({ top: rect.bottom - maxVisibleBottom, behavior: 'smooth' });
      }

      setPendingScrollTopicId(null);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [expandedTopicId, pendingScrollTopicId, topicSectionsWithProgress]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const hasActiveSearch = normalizedSearchTerm.length > 0;

  const searchMatchCountByTopicId = useMemo(() => {
    const matchCountByTopicId = new Map<string, number>();
    if (!hasActiveSearch) {
      return matchCountByTopicId;
    }

    for (const section of topicSectionsWithProgress) {
      const matchCount = section.problems.filter((problem) =>
        problemMatchesSearch(problem, normalizedSearchTerm),
      ).length;

      if (matchCount > 0) {
        matchCountByTopicId.set(section.topic.id, matchCount);
      }
    }

    return matchCountByTopicId;
  }, [hasActiveSearch, normalizedSearchTerm, topicSectionsWithProgress]);

  const handleToggleProblem = useCallback(
    async (problem: Problem, isSolved: boolean): Promise<void> => {
      const previousProgress = progressByProblemId[problem.id];

      const optimisticProgress: UserProgress = {
        id: previousProgress?.id ?? `temp-${problem.id}`,
        userId: previousProgress?.userId ?? user?.id ?? '',
        problemId: problem.id,
        topicId: problem.topicId,
        completed: isSolved,
        status: isSolved ? 'solved' : 'pending',
        notes: previousProgress?.notes,
        completedAt: isSolved ? new Date().toISOString() : undefined,
      };

      setUpdatingProblemIds((previous) => ({ ...previous, [problem.id]: true }));
      setProgressByProblemId((previous) => ({ ...previous, [problem.id]: optimisticProgress }));

      try {
        const response = await api.post<ApiResponse<RawProgress>>('/progress/toggle', {
          problemId: problem.id,
          status: isSolved ? 'solved' : 'pending',
        });

        const updatedProgress = normalizeProgress(response.data.data);
        setProgressByProblemId((previous) => ({ ...previous, [problem.id]: updatedProgress }));
      } catch (error) {
        setDashboardError(getApiErrorMessage(error));
        setProgressByProblemId((previous) => {
          if (previousProgress) {
            return { ...previous, [problem.id]: previousProgress };
          }

          const next = { ...previous };
          delete next[problem.id];
          return next;
        });
      } finally {
        setUpdatingProblemIds((previous) => ({ ...previous, [problem.id]: false }));
      }
    },
    [progressByProblemId, user?.id],
  );

  if (isLoading || (isAuthenticated && isDashboardLoading)) {
    return (
      <div className="font-body flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          <p className="font-medium text-on-surface-variant">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="font-body flex min-h-screen items-center justify-center bg-surface">
        <p className="font-medium text-on-surface-variant">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="font-body min-h-screen bg-surface text-on-surface selection:bg-primary-fixed-dim">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-surface-container-low/85 px-4 shadow-[0_20px_40px_rgba(99,102,241,0.06)] backdrop-blur-md md:px-6">
        <div className="flex items-center gap-4 md:gap-8">
          <span className="font-headline text-lg font-extrabold tracking-tight text-on-surface md:text-xl">
            DSA Architect
          </span>
          <div className="hidden items-center gap-6 md:flex">
            {topTabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  'py-5 font-headline text-sm font-bold tracking-tight transition-colors',
                  tab.href === '/'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-on-surface-variant hover:text-primary',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 md:flex">
            <Icon name="search" className="h-4 w-4 text-outline" />
            <input
              type="text"
              className="w-32 border-none bg-transparent text-sm text-on-surface outline-none placeholder:text-outline lg:w-48"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:text-primary active:scale-95"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
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
              <Icon
                name="chevron"
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
                    onClick={() => {
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Icon name="logout" className="h-4 w-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen pt-16">
        <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col space-y-2 bg-surface-container py-8 pl-4 lg:flex">
          <div className="mb-8 pr-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name="architecture" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold leading-tight text-on-surface">
                  Learning Path
                </h3>
                <p className="text-xs font-semibold text-primary">
                  {overallProgressPercent}% Completed
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
            {sidebarItems.map((item) => {
              const matchedCount = item.topicId
                ? searchMatchCountByTopicId.get(item.topicId)
                : undefined;
              const isSearchMatched = hasActiveSearch && Boolean(matchedCount);

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    if (!item.topicId) return;
                    handleSidebarSelect(item.topicId);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left font-headline text-sm font-semibold transition-all',
                    item.active
                      ? 'rounded-l-xl border-r-4 border-primary bg-surface-container-lowest text-primary'
                      : 'text-on-surface-variant hover:translate-x-1 hover:bg-surface-container-high',
                    isSearchMatched &&
                      !item.active &&
                      'rounded-l-xl bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(79,70,229,0.22)]',
                    isSearchMatched && item.active && 'shadow-[0_10px_28px_rgba(79,70,229,0.2)]',
                  )}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {isSearchMatched && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {matchedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pr-4">
            <button
              type="button"
              onClick={handleResume}
              disabled={!resumeProblem}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:shadow-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resumeProblem ? 'Resume Last Problem' : 'No Problems Yet'}
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-surface p-4 md:p-8 lg:ml-64">
          <section className="mx-auto mb-6 max-w-5xl rounded-2xl bg-surface-container-low p-5 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <Icon name="architecture" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold">Learning Path</h2>
                  <p className="text-xs font-semibold text-primary">
                    {overallProgressPercent}% Completed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={isLoggingOut}
                className="rounded-full border border-outline-variant bg-white px-3 py-1.5 text-xs font-bold text-on-surface"
              >
                {isLoggingOut ? 'Logging...' : 'Logout'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleResume}
              disabled={!resumeProblem}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resumeProblem ? 'Resume Last Problem' : 'No Problems Yet'}
            </button>
          </section>

          <header className="mx-auto mb-10 max-w-5xl">
            <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  Curriculum Roadmap
                </p>
                <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                  The AlgoFlow Core
                </h1>
                <p className="mt-3 max-w-xl text-sm text-on-surface-variant md:text-base">
                  Master the fundamental patterns of competitive programming through our curated
                  collection of industry-standard challenges.
                </p>
              </div>

              <div className="md:text-right">
                <div className="mb-1 flex items-center gap-2 md:justify-end">
                  <span className="font-headline text-2xl font-bold">{totalSolved}</span>
                  <span className="text-on-surface-variant">/ {totalProblems} Solved</span>
                </div>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${overallProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {summaryCards.map((card) => (
                <article
                  key={card.label}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border-l-4 bg-surface-container-lowest p-6 transition-transform hover:-translate-y-1',
                    card.accentClassName,
                  )}
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg',
                      card.iconClassName,
                    )}
                  >
                    <Icon name={card.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {card.label}
                    </p>
                    <p className="font-headline text-2xl font-bold">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </header>

          <section className="mx-auto max-w-5xl space-y-6">
            {dashboardError && (
              <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{dashboardError}</p>
                <button
                  type="button"
                  onClick={() => {
                    void loadDashboardData();
                  }}
                  className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Retry Loading Data
                </button>
              </article>
            )}

            {topicSectionsWithProgress.length === 0 && !dashboardError && (
              <article className="rounded-xl bg-surface-container-low p-6 text-sm text-on-surface-variant">
                No topics available yet. Seed your database to view the structured DSA sheet.
              </article>
            )}

            {topicSectionsWithProgress.map((section) => {
              const isExpanded = section.topic.id === expandedTopicId;
              const { barClassName, textClassName } = getProgressTone(section.completionPercent);

              const visibleProblems =
                normalizedSearchTerm.length === 0
                  ? section.problems
                  : section.problems.filter((problem) => {
                      return problemMatchesSearch(problem, normalizedSearchTerm);
                    });
              const isSearchMatched = hasActiveSearch && visibleProblems.length > 0;

              return (
                <article
                  key={section.topic.id}
                  id={`topic-${section.topic.id}`}
                  className={cn(
                    'overflow-hidden rounded-xl bg-surface-container-low transition-shadow',
                    !isExpanded && 'opacity-95 transition-opacity hover:opacity-100',
                    isSearchMatched &&
                      'ring-1 ring-primary/35 shadow-[0_16px_36px_rgba(79,70,229,0.14)]',
                    isSearchMatched && isExpanded && 'ring-2',
                  )}
                >
                  <div
                    className="flex items-center justify-between gap-4 p-5 md:p-6 cursor-pointer"
                    onClick={() => {
                      setExpandedTopicId((current) =>
                        current === section.topic.id ? null : section.topic.id,
                      );
                    }}
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                        <Icon name={getTopicIcon(section.topic.slug)} className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-headline text-2xl font-bold leading-tight">
                            {section.topic.title}
                          </h2>
                          <span className="rounded-full bg-surface-container-highest px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
                            {section.solvedCount}/{section.problems.length}
                          </span>
                          {isSearchMatched && (
                            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                              {visibleProblems.length} matches
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-4">
                          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-container-high">
                            <div
                              className={cn('h-full', barClassName)}
                              style={{ width: `${section.completionPercent}%` }}
                            />
                          </div>
                          <span className={cn('text-sm font-semibold', textClassName)}>
                            {section.completionPercent}% Complete
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-outline transition-colors hover:text-primary"
                      aria-label={`Toggle ${section.topic.title}`}
                    >
                      <Icon
                        name="chevron"
                        className={cn('h-5 w-5 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 px-5 pb-5 md:px-6 md:pb-6">
                      {visibleProblems.length === 0 && (
                        <div className="rounded-lg bg-white p-4 text-sm text-on-surface-variant">
                          {normalizedSearchTerm
                            ? 'No problems match the current search.'
                            : 'No problems found for this topic.'}
                        </div>
                      )}

                      {visibleProblems.map((problem) => {
                        const progress = progressByProblemId[problem.id];
                        const isSolved = progress?.completed ?? false;
                        const isUpdating = updatingProblemIds[problem.id] ?? false;
                        const hint =
                          problem.tags.length > 0
                            ? `Pattern: ${problem.tags[0]}`
                            : `Platform: ${problem.platform}`;

                        return (
                          <div
                            key={problem.id}
                            className="group flex items-center justify-between gap-4 rounded-lg bg-white p-4 transition-shadow hover:shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={isSolved}
                                disabled={isUpdating}
                                onChange={(event) => {
                                  void handleToggleProblem(problem, event.target.checked);
                                }}
                                aria-label={`Mark ${problem.title} as solved`}
                                className="h-5 w-5 cursor-pointer rounded border-outline text-primary focus:ring-primary disabled:cursor-not-allowed"
                              />
                              <div>
                                <p className="font-headline text-lg font-bold leading-tight text-on-surface">
                                  {problem.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <DifficultyTag difficulty={problem.difficulty} />
                                  <span className="text-xs font-medium text-on-surface-variant">
                                    {hint}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={problem.problemUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary transition-all hover:bg-primary-container"
                                title="Solve on LeetCode"
                                aria-label={`Solve ${problem.title} on LeetCode`}
                              >
                                <Icon name="code" className="h-4 w-4" />
                              </a>

                              {problem.youtubeUrl && (
                                <a
                                  href={problem.youtubeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-all hover:bg-red-100"
                                  title="Watch YouTube explanation"
                                  aria-label={`Watch YouTube explanation for ${problem.title}`}
                                >
                                  <Icon name="youtube" className="h-4 w-4" />
                                </a>
                              )}

                              {problem.articleUrl && (
                                <a
                                  href={problem.articleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-all hover:bg-slate-100"
                                  title="Read article"
                                  aria-label={`Read article for ${problem.title}`}
                                >
                                  <Icon name="read" className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}

            <article className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-primary to-primary-container p-6 md:p-8">
              <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-md">
                  <span className="rounded-full border border-indigo-500/60 bg-indigo-900/45 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-200">
                    Pro Feature
                  </span>
                  <h2 className="mt-4 font-headline text-3xl font-extrabold leading-tight text-white md:text-5xl">
                    Master System Design with Visual Architect
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-indigo-100 md:text-base">
                    Go beyond coding. Learn how to design scalable, distributed systems used by
                    companies like Netflix and Amazon.
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-xl transition-all hover:bg-indigo-50 active:scale-95"
                  >
                    Upgrade to Pro
                  </button>
                </div>

                <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl bg-white/90 p-4 shadow-2xl">
                  <svg viewBox="0 0 160 160" className="h-full w-full text-primary">
                    <path
                      d="M20 130 66 38h40l34 92M39 130l38-75M57 130l34-68M92 130l28-55"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      opacity=".35"
                    />
                    <path
                      d="M26 128h104"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity=".45"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-14 right-24 h-60 w-60 rounded-full bg-indigo-400/20 blur-3xl" />
              <div className="absolute right-0 top-0 h-full w-1/3 skew-x-12 bg-white/5 translate-x-1/2" />
            </article>
          </section>

          <div className="h-16" />
        </main>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl transition-all hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="AI assistant"
      >
        <Icon name="spark" className="h-6 w-6" />
      </button>
    </div>
  );
}
