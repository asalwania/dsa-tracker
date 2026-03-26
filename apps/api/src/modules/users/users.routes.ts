import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, userIdParamSchema } from './users.types.js';

const router = Router();

/** GET /api/users/profile — Get authenticated user's profile */
router.get('/profile', authenticate, usersController.getProfile);

/** PATCH /api/users/profile — Update authenticated user's profile */
router.patch(
  '/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  usersController.updateProfile,
);

/** GET /api/users/:id — Get user by ID (admin only) */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: userIdParamSchema }),
  usersController.getById,
);

export default router;
