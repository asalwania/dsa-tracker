import { z } from 'zod';

/** Schema for creating a new topic */
export const createTopicSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  order: z.coerce.number().int().min(1, 'Order must be at least 1'),
  icon: z.string().optional().default(''),
});

/** Schema for updating an existing topic */
export const updateTopicSchema = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  order: z.coerce.number().int().min(1).optional(),
  icon: z.string().optional(),
});

/** Schema for topic slug param */
export const topicSlugParamSchema = z.object({
  slug: z.string().min(1),
});

/** Schema for topic ID param */
export const topicIdParamSchema = z.object({
  id: z.string().min(1),
});

/** Inferred types */
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
