import type { IStreak } from './streaks.model.js';

/**
 * Service layer for streak tracking.
 * Manages daily activity streaks and total solved counts.
 */
export const streaksService = {
  /**
   * Retrieves the streak data for a user.
   * Creates a default streak record if one does not exist.
   * @param userId - The user's MongoDB ObjectId
   * @returns Streak document
   */
  async getUserStreak(_userId: string): Promise<IStreak> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Updates a user's streak after they solve a problem.
   * Called internally by the progress service.
   *
   * Logic:
   * - If lastActivityDate is today: increment totalSolved only
   * - If lastActivityDate is yesterday: increment currentStreak + totalSolved
   * - If lastActivityDate is older: reset currentStreak to 1, increment totalSolved
   * - Update longestStreak if currentStreak exceeds it
   *
   * @param userId - The user's MongoDB ObjectId
   * @returns Updated streak document
   */
  async updateStreak(_userId: string): Promise<IStreak> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },
};
