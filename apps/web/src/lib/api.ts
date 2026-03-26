import { api } from '@/lib/axios';
import type { ApiResponse, LeaderboardEntry, Streak, UserProgress } from '@/types';

export const getMyStreak = () => api.get<ApiResponse<Streak>>('/streaks');

export const getMyProgress = () =>
  api.get<ApiResponse<UserProgress[]>>('/progress');

export const getLeaderboard = (sortBy: 'totalSolved' | 'currentStreak') =>
  api.get<ApiResponse<LeaderboardEntry[]>>(`/leaderboard?limit=50&sortBy=${sortBy}`);
