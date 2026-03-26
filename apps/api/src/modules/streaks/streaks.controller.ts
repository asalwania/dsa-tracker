import type { Request, Response, NextFunction } from 'express';
import { streaksService } from './streaks.service.js';
import { sendResponse } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Controller for streak endpoints.
 */
export const streaksController = {
  /**
   * GET /api/streaks
   * Retrieves the authenticated user's streak data.
   */
  async getUserStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const streak = await streaksService.getUserStreak(req.user.userId);
      sendResponse(res, 200, streak, 'Streak retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
