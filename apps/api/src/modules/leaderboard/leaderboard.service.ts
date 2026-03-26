import type { LeaderboardEntry, LeaderboardQuery } from './leaderboard.types.js';

/**
 * Service layer for the global leaderboard.
 * Aggregates streak and progress data to rank users.
 */
export const leaderboardService = {
  /**
   * Retrieves the global leaderboard.
   * Joins streak data with user profiles and ranks by the specified field.
   * Results are cached for 5 minutes.
   * @param query - Leaderboard query options (limit, sortBy)
   * @returns Array of ranked leaderboard entries
   */
  async getLeaderboard(_query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },
};
