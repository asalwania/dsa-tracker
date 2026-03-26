import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/** Configuration options for the rate limiter */
interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Redis key prefix for this limiter */
  keyPrefix: string;
}

/**
 * Creates a sliding-window rate limiter backed by Redis sorted sets.
 *
 * Algorithm:
 * 1. Remove all entries older than the current window
 * 2. Add the current timestamp as a new entry
 * 3. Count entries in the window
 * 4. If count exceeds max, reject with 429
 * 5. Set TTL on the key for automatic cleanup
 *
 * @param options - Rate limiter configuration
 * @returns Express middleware function
 */
export function createRateLimiter(
  options: RateLimiterOptions,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { windowMs, maxRequests, keyPrefix } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const key = `rl:${keyPrefix}:${ip}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      const ttlSeconds = Math.ceil(windowMs / 1000);

      // Execute all operations in a pipeline for atomicity
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now.toString(), `${now}:${Math.random().toString(36).slice(2)}`);
      pipeline.zcard(key);
      pipeline.expire(key, ttlSeconds);

      const results = await pipeline.exec();
      if (!results) {
        next();
        return;
      }

      const countResult = results[2];
      const count = countResult ? (countResult[1] as number) : 0;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', retryAfter);
        throw AppError.tooManyRequests(
          `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          'RATE_LIMIT_EXCEEDED',
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      // On Redis failures, allow the request through (fail-open)
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limiter Redis error, allowing request through', { error: message });
      next();
    }
  };
}

/** Login rate limiter: 10 requests per 5 minutes */
export const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'login',
});

/** Registration rate limiter: 5 requests per 1 hour */
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'register',
});

/** General API rate limiter: 500 requests per 1 minute */
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 500,
  keyPrefix: 'api',
});
