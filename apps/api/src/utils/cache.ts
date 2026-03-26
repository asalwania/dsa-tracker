import { redis } from '../config/redis.js';
import { logger } from './logger.js';

/**
 * Retrieves a cached value from Redis and parses it as JSON.
 * Returns null on cache miss or error (cache failures are non-fatal).
 * @param key - Redis key
 * @returns Parsed cached value or null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Cache GET failed', { key, error: message });
    return null;
  }
}

/**
 * Stores a value in Redis with a TTL.
 * Cache failures are logged but never thrown.
 * @param key - Redis key
 * @param data - Value to cache (will be JSON-serialized)
 * @param ttlSeconds - Time-to-live in seconds
 */
export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Cache SET failed', { key, error: message });
  }
}

/**
 * Deletes a single key from Redis.
 * Cache failures are logged but never thrown.
 * @param key - Redis key to delete
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Cache DELETE failed', { key, error: message });
  }
}

/**
 * Deletes all Redis keys matching a glob pattern.
 * Uses SCAN to avoid blocking Redis, deleting in batches of 100.
 * Cache failures are logged but never thrown.
 * @param pattern - Redis key glob pattern (e.g. "cache:topics:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Cache DELETE PATTERN failed', { pattern, error: message });
  }
}
