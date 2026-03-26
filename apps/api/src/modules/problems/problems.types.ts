import { z } from 'zod';

/** Schema for creating a new problem */
export const createProblemSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200),
  topicId: z.string().min(1, 'Topic ID is required'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
  }),
  tags: z.array(z.string()).optional().default([]),
  platform: z.enum(['leetcode', 'gfg', 'codeforces'], {
    errorMap: () => ({ message: 'Platform must be leetcode, gfg, or codeforces' }),
  }),
  problemUrl: z.string().url('Problem URL must be a valid URL'),
  youtubeUrl: z.string().url().optional().or(z.literal('')).default(''),
  articleUrl: z.string().url().optional().or(z.literal('')).default(''),
  companies: z.array(z.string()).optional().default([]),
  order: z.coerce.number().int().min(1, 'Order must be at least 1'),
});

/** Schema for updating a problem */
export const updateProblemSchema = z.object({
  slug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  title: z.string().min(1).max(200).optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).optional(),
  platform: z.enum(['leetcode', 'gfg', 'codeforces']).optional(),
  problemUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  articleUrl: z.string().url().optional().or(z.literal('')),
  companies: z.array(z.string()).optional(),
  order: z.coerce.number().int().min(1).optional(),
});

/** Schema for listing problems with filters */
export const listProblemsQuerySchema = z.object({
  topicId: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  platform: z.enum(['leetcode', 'gfg', 'codeforces']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

/** Schema for problem slug param */
export const problemSlugParamSchema = z.object({
  slug: z.string().min(1),
});

/** Schema for problem ID param */
export const problemIdParamSchema = z.object({
  id: z.string().min(1),
});

/** Inferred types */
export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type ListProblemsQuery = z.infer<typeof listProblemsQuerySchema>;
