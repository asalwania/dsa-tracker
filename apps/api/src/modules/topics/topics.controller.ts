import type { Request, Response, NextFunction } from 'express';
import { topicsService } from './topics.service.js';
import { sendResponse } from '../../utils/response.js';

/**
 * Controller for topic endpoints.
 * Each method handles a single HTTP route and delegates to the topics service.
 */
export const topicsController = {
  /**
   * GET /api/topics
   * Retrieves all topics ordered by display order.
   */
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topics = await topicsService.getAll();
      sendResponse(res, 200, topics, 'Topics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/topics/:slug
   * Retrieves a single topic by its URL slug.
   */
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = await topicsService.getBySlug(req.params['slug']!);
      sendResponse(res, 200, topic, 'Topic retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/topics
   * Creates a new topic (admin only).
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = await topicsService.create(req.body);
      sendResponse(res, 201, topic, 'Topic created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/topics/:id
   * Updates an existing topic by ID (admin only).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = await topicsService.update(req.params['id']!, req.body);
      sendResponse(res, 200, topic, 'Topic updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/topics/:id
   * Deletes a topic by ID (admin only).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await topicsService.delete(req.params['id']!);
      sendResponse(res, 200, null, 'Topic deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
