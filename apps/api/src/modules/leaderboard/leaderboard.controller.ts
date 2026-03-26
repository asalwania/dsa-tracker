import type { Request, Response, NextFunction } from 'express';
import { leaderboardService } from './leaderboard.service.js';
import { sendResponse } from '../../utils/response.js';

/**
 * Controller for leaderboard endpoints.
 */
export const leaderboardController = {
  /**
   * GET /api/leaderboard
   * Retrieves the global leaderboard (top users by solved count or streak).
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderboard = await leaderboardService.getLeaderboard(req.query as never);
      sendResponse(res, 200, leaderboard, 'Leaderboard retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
