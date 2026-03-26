import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { redis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import type { Server } from 'http';

let server: Server;

/**
 * Starts the API server after establishing database and cache connections.
 */
async function startServer(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Verify Redis is ready
  if (redis.status !== 'ready') {
    logger.info('Waiting for Redis connection...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 10_000);

      redis.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redis.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // Start HTTP server
  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

/**
 * Gracefully shuts down the server and all connections.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    // Close HTTP server (stop accepting new connections)
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      logger.info('HTTP server closed');
    }

    // Disconnect Redis
    await disconnectRedis();

    // Disconnect MongoDB
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error during graceful shutdown', { error: message });
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error('Unhandled rejection', { error: message });
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the server
startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('Failed to start server', { error: message });
  process.exit(1);
});
