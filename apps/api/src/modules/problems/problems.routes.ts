import { Router } from 'express';
import { problemsController } from './problems.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { cacheMiddleware } from '../../middleware/cache.js';
import {
  createProblemSchema,
  updateProblemSchema,
  listProblemsQuerySchema,
  problemSlugParamSchema,
  problemIdParamSchema,
} from './problems.types.js';
import { z } from 'zod';

const router = Router();

/**
 * Public routes
 */

/** GET /api/problems — List problems with filters (cached 10 min) */
router.get(
  '/',
  validate({ query: listProblemsQuerySchema }),
  cacheMiddleware(600),
  problemsController.getAll,
);

/** GET /api/problems/topic/:topicId — Get problems by topic (cached 10 min) */
router.get(
  '/topic/:topicId',
  validate({ params: z.object({ topicId: z.string().min(1) }) }),
  cacheMiddleware(600),
  problemsController.getByTopic,
);

/** GET /api/problems/:slug — Get problem by slug (cached 10 min) */
router.get(
  '/:slug',
  validate({ params: problemSlugParamSchema }),
  cacheMiddleware(600),
  problemsController.getBySlug,
);

/**
 * Admin-only routes
 */

/** POST /api/problems — Create a new problem */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createProblemSchema }),
  problemsController.create,
);

/** PUT /api/problems/:id — Update an existing problem */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: problemIdParamSchema, body: updateProblemSchema }),
  problemsController.update,
);

/** DELETE /api/problems/:id — Delete a problem */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: problemIdParamSchema }),
  problemsController.delete,
);

export default router;
