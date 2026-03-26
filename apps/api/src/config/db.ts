import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** Maximum number of connection retry attempts */
const MAX_RETRIES = 5;

/** Base delay in milliseconds for exponential backoff */
const BASE_DELAY_MS = 1000;

/**
 * Connects to MongoDB with retry logic using exponential backoff.
 * On final failure, the process exits with code 1.
 */
export async function connectDB(): Promise<void> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      logger.info('MongoDB connected successfully', {
        uri: env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'),
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('error', (error: Error) => {
        logger.error('MongoDB connection error', { error: error.message });
      });

      return;
    } catch (error) {
      attempt++;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (attempt >= MAX_RETRIES) {
        logger.error(`MongoDB connection failed after ${MAX_RETRIES} attempts`, {
          error: errorMessage,
        });
        process.exit(1);
      }

      logger.warn(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`,
        { error: errorMessage },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
