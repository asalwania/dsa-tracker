import type { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../utils/cache.js';

/**
 * Response caching middleware factory.
 * On cache hit, returns the cached response with X-Cache: HIT.
 * On cache miss, intercepts res.json() to cache the response body with X-Cache: MISS.
 *
 * @param ttlSeconds - Cache time-to-live in seconds
 * @param keyGenerator - Optional custom key generator (defaults to `cache:{method}:{originalUrl}`)
 * @returns Express middleware function
 */
export function cacheMiddleware(
  ttlSeconds: number,
  keyGenerator?: (req: Request) => string,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl}`;

    try {
      const cached = await cacheGet<{ statusCode: number; body: unknown }>(key);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    } catch {
      // Cache read failure — proceed without cache
    }

    // Monkey-patch res.json to intercept the response and cache it
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      res.setHeader('X-Cache', 'MISS');

      // Cache the response asynchronously (fire-and-forget)
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        void cacheSet(key, { statusCode, body }, ttlSeconds);
      }

      return originalJson(body);
    };

    next();
  };
}
