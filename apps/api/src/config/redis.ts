import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Redis client configured with retry strategy and event logging.
 * Uses exponential backoff capped at 3 seconds on connection failures.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 10) {
      logger.error('Redis: max retry attempts exceeded, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (error: Error) => {
  logger.error('Redis client error', { error: error.message });
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

/**
 * Gracefully disconnects the Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis client disconnected gracefully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error disconnecting Redis', { error: message });
  }
}
