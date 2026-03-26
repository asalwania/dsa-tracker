import { Router } from 'express';
import { progressController } from './progress.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { toggleProgressSchema, topicProgressParamSchema } from './progress.types.js';

const router = Router();

/** All progress routes require authentication */
router.use(authenticate);

/** POST /api/progress/toggle — Toggle problem completion */
router.post(
  '/toggle',
  validate({ body: toggleProgressSchema }),
  progressController.toggleProblem,
);

/** GET /api/progress — Get all user progress */
router.get('/', progressController.getUserProgress);

/** GET /api/progress/topic/:topicId — Get user progress for a topic */
router.get(
  '/topic/:topicId',
  validate({ params: topicProgressParamSchema }),
  progressController.getTopicProgress,
);

export default router;
