import { z } from 'zod';

/** Schema for leaderboard query params */
export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
  sortBy: z.enum(['totalSolved', 'currentStreak']).optional().default('totalSolved'),
});

/** Leaderboard entry returned to clients */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  totalSolved: number;
  currentStreak: number;
}

/** Inferred type */
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
