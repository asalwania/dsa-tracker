import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Extracts duplicate key details from a MongoDB 11000 error.
 */
function getDuplicateKeyMessage(error: Record<string, unknown>): string {
  const keyValue = error['keyValue'] as Record<string, unknown> | undefined;
  if (keyValue) {
    const field = Object.keys(keyValue)[0] ?? 'field';
    return `Duplicate value for '${field}'`;
  }
  return 'Duplicate key error';
}

/**
 * Global error handling middleware.
 * Converts known error types into structured AppError responses.
 *
 * Handles:
 * - AppError (operational errors)
 * - Mongoose ValidationError → 400
 * - Mongoose CastError → 400 INVALID_ID
 * - MongoDB duplicate key (code 11000) → 409
 * - Unknown errors → 500 (details hidden in production)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log every error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(req.user && { userId: req.user.userId }),
  });

  // Already an operational AppError — send as-is
  if (err instanceof AppError) {
    sendError(res, err);
    return;
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).map(([field, validationError]) => ({
      field,
      message: validationError.message,
    }));

    sendError(res, AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
    return;
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    sendError(
      res,
      AppError.badRequest(
        `Invalid ${err.path}: ${String(err.value)}`,
        'INVALID_ID',
      ),
    );
    return;
  }

  // MongoDB duplicate key error
  const errWithCode = err as Record<string, unknown>;
  if (errWithCode['code'] === 11000) {
    const message = getDuplicateKeyMessage(errWithCode);
    sendError(res, AppError.conflict(message, 'DUPLICATE_ENTRY'));
    return;
  }

  // Unknown / unexpected error
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  sendError(res, AppError.internal(message, 'INTERNAL_ERROR'));
}
