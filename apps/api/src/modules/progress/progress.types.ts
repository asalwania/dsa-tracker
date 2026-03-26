import { z } from 'zod';

/** Schema for toggling problem progress */
export const toggleProgressSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  status: z.enum(['solved', 'attempted', 'skipped', 'pending']).optional().default('solved'),
  notes: z.string().max(2000).optional(),
});

/** Schema for querying user progress by topic */
export const topicProgressParamSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
});

/** Inferred types */
export type ToggleProgressInput = z.infer<typeof toggleProgressSchema>;
