import type { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { sendResponse } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Controller for user endpoints.
 */
export const usersController = {
  /**
   * GET /api/users/profile
   * Retrieves the authenticated user's profile.
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const user = await usersService.getProfile(req.user.userId);
      sendResponse(res, 200, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/users/profile
   * Updates the authenticated user's profile.
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const user = await usersService.updateProfile(req.user.userId, req.body);
      sendResponse(res, 200, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users/:id
   * Retrieves a user by ID (admin only).
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getById(req.params['id']!);
      sendResponse(res, 200, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
