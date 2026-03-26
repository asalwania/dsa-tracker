// =============================================================================
// User
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
}

// =============================================================================
// Auth
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// =============================================================================
// Topic
// =============================================================================

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  icon?: string;
  totalProblems: number;
  solvedCount?: number;
}

// =============================================================================
// Problem
// =============================================================================

export interface Problem {
  id: string;
  slug: string;
  title: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  platform: 'leetcode' | 'gfg' | 'codeforces';
  problemUrl: string;
  youtubeUrl?: string;
  articleUrl?: string;
  companies: string[];
  order: number;
  isCompleted?: boolean;
  status?: ProgressStatus;
}

export type ProgressStatus = 'solved' | 'attempted' | 'skipped' | 'pending';

// =============================================================================
// Progress
// =============================================================================

export interface UserProgress {
  id: string;
  userId: string;
  problemId: string;
  topicId: string;
  completed: boolean;
  status: ProgressStatus;
  notes?: string;
  completedAt?: string;
}

// =============================================================================
// Streak
// =============================================================================

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  lastActivityDate: string;
}

// =============================================================================
// Leaderboard
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  totalSolved: number;
  currentStreak: number;
}

// =============================================================================
// API Response
// =============================================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
