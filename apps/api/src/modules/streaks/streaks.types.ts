import { z } from 'zod';

/** Schema for the streak response */
export const streakResponseSchema = z.object({
  currentStreak: z.number(),
  longestStreak: z.number(),
  totalSolved: z.number(),
  lastActivityDate: z.string().nullable(),
});

/** Inferred type */
export type StreakResponse = z.infer<typeof streakResponseSchema>;
