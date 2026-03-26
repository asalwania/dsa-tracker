import type { IProgress } from './progress.model.js';
import type { ToggleProgressInput } from './progress.types.js';

/**
 * Service layer for user progress tracking.
 * Manages problem completion status, notes, and per-topic progress summaries.
 */
export const progressService = {
  /**
   * Toggles a problem's completion status for a user.
   * If no progress record exists, creates one. Otherwise, updates it.
   * Also triggers streak updates via the streaks service.
   * @param userId - The user's MongoDB ObjectId
   * @param data - Toggle input (problemId, status, notes)
   * @returns The created or updated progress document
   */
  async toggleProblem(_userId: string, _data: ToggleProgressInput): Promise<IProgress> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Retrieves all progress entries for a user.
   * @param userId - The user's MongoDB ObjectId
   * @returns Array of progress documents
   */
  async getUserProgress(_userId: string): Promise<IProgress[]> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Retrieves progress entries for a user within a specific topic.
   * @param userId - The user's MongoDB ObjectId
   * @param topicId - The topic's MongoDB ObjectId
   * @returns Array of progress documents for the topic
   */
  async getTopicProgress(_userId: string, _topicId: string): Promise<IProgress[]> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },
};
