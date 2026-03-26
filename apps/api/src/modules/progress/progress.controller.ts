import type { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service.js';
import { sendResponse } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Controller for progress endpoints.
 */
export const progressController = {
  /**
   * POST /api/progress/toggle
   * Toggles a problem's completion status for the authenticated user.
   */
  async toggleProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const progress = await progressService.toggleProblem(req.user.userId, req.body);
      sendResponse(res, 200, progress, 'Progress updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/progress
   * Retrieves all progress for the authenticated user.
   */
  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const progress = await progressService.getUserProgress(req.user.userId);
      sendResponse(res, 200, progress, 'Progress retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/progress/topic/:topicId
   * Retrieves progress for the authenticated user within a specific topic.
   */
  async getTopicProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const progress = await progressService.getTopicProgress(
        req.user.userId,
        req.params['topicId']!,
      );
      sendResponse(res, 200, progress, 'Topic progress retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
