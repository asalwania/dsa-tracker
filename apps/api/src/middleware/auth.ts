import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { redis } from '../config/redis.js';

/**
 * Authentication middleware.
 * Extracts the Bearer token from the Authorization header, verifies it,
 * checks the Redis blacklist, and attaches the user to the request.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed authorization header', 'NO_TOKEN');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Check if the token's JTI has been blacklisted (e.g. after logout)
    const isBlacklisted = await redis.exists(`blacklist:${payload.jti}`);
    if (isBlacklisted) {
      throw AppError.unauthorized('Token has been revoked', 'TOKEN_REVOKED');
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as 'user' | 'admin',
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware factory.
 * Returns middleware that checks if the authenticated user has one of the allowed roles.
 * @param roles - Allowed roles (e.g. 'admin', 'user')
 */
export function authorize(
  ...roles: string[]
): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'NOT_AUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`,
          'INSUFFICIENT_ROLE',
        ),
      );
    }

    next();
  };
}
