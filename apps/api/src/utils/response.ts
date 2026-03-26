import type { Response } from 'express';
import { AppError } from './AppError.js';
import { env } from '../config/env.js';

/** Pagination metadata for list endpoints */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Sends a standard success response.
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Response payload
 * @param message - Optional success message
 */
export function sendResponse<T>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Sends a paginated success response.
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param data - Array of items for the current page
 * @param pagination - Pagination metadata
 */
export function sendPaginatedResponse<T>(
  res: Response,
  statusCode: number,
  data: T[],
  pagination: PaginationMeta,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

/**
 * Sends a structured error response.
 * Hides internal error details in production.
 * @param res - Express response object
 * @param error - AppError or generic Error
 */
export function sendError(res: Response, error: AppError | Error): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  const statusCode = 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    },
  });
}
