import { z } from 'zod';

/** Schema for updating a user profile */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

/** Schema for user ID param */
export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

/** Inferred types */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
