import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller.js';
import { validate } from '../../middleware/validate.js';
import { cacheMiddleware } from '../../middleware/cache.js';
import { leaderboardQuerySchema } from './leaderboard.types.js';

const router = Router();

/** GET /api/leaderboard — Get global leaderboard (cached 5 min) */
router.get(
  '/',
  validate({ query: leaderboardQuerySchema }),
  cacheMiddleware(300),
  leaderboardController.getLeaderboard,
);

export default router;
