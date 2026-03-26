import { Router } from 'express';
import { streaksController } from './streaks.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

/** All streak routes require authentication */
router.use(authenticate);

/** GET /api/streaks — Get the authenticated user's streak */
router.get('/', streaksController.getUserStreak);

export default router;
