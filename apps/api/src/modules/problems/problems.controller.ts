import type { Request, Response, NextFunction } from 'express';
import { problemsService } from './problems.service.js';
import { sendResponse, sendPaginatedResponse } from '../../utils/response.js';

/**
 * Controller for problem endpoints.
 * Each method handles a single HTTP route and delegates to the problems service.
 */
export const problemsController = {
  /**
   * GET /api/problems
   * Retrieves a paginated, filterable list of problems.
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { problems, pagination } = await problemsService.getAll(req.query as never);
      sendPaginatedResponse(res, 200, problems, pagination);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/problems/topic/:topicId
   * Retrieves all problems for a specific topic.
   */
  async getByTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await problemsService.getByTopic(req.params['topicId']!);
      sendResponse(res, 200, problems, 'Problems retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/problems/:slug
   * Retrieves a single problem by its URL slug.
   */
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await problemsService.getBySlug(req.params['slug']!);
      sendResponse(res, 200, problem, 'Problem retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/problems
   * Creates a new problem (admin only).
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await problemsService.create(req.body);
      sendResponse(res, 201, problem, 'Problem created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/problems/:id
   * Updates an existing problem by ID (admin only).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await problemsService.update(req.params['id']!, req.body);
      sendResponse(res, 200, problem, 'Problem updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/problems/:id
   * Deletes a problem by ID (admin only).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await problemsService.delete(req.params['id']!);
      sendResponse(res, 200, null, 'Problem deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
