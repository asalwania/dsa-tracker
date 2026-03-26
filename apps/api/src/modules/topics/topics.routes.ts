import { Router } from 'express';
import { topicsController } from './topics.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { cacheMiddleware } from '../../middleware/cache.js';
import {
  createTopicSchema,
  updateTopicSchema,
  topicSlugParamSchema,
  topicIdParamSchema,
} from './topics.types.js';

const router = Router();

/**
 * Public routes
 */

/** GET /api/topics — List all topics (cached 10 min) */
router.get('/', cacheMiddleware(600), topicsController.getAll);

/** GET /api/topics/:slug — Get topic by slug (cached 10 min) */
router.get(
  '/:slug',
  validate({ params: topicSlugParamSchema }),
  cacheMiddleware(600),
  topicsController.getBySlug,
);

/**
 * Admin-only routes
 */

/** POST /api/topics — Create a new topic */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createTopicSchema }),
  topicsController.create,
);

/** PUT /api/topics/:id — Update an existing topic */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: topicIdParamSchema, body: updateTopicSchema }),
  topicsController.update,
);

/** DELETE /api/topics/:id — Delete a topic */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: topicIdParamSchema }),
  topicsController.delete,
);

export default router;
