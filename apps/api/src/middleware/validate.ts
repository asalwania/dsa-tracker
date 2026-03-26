import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

/** Schema definition for request validation */
interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Request validation middleware factory.
 * Validates req.body, req.query, and/or req.params against the provided Zod schemas.
 * On success, replaces each property with the parsed (cleaned) data.
 * On failure, throws AppError.badRequest with formatted Zod field errors.
 *
 * @param schema - Object containing optional Zod schemas for body, query, and params
 * @returns Express middleware function
 */
export function validate(
  schema: ValidationSchema,
): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query) as typeof req.query;
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params) as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        next(AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
        return;
      }

      next(error);
    }
  };
}
