import { redis } from '../../config/redis.js';
import { Streak } from '../streaks/streaks.model.js';
import type { LeaderboardEntry, LeaderboardQuery } from './leaderboard.types.js';

const CACHE_TTL = 300; // 5 minutes

/**
 * Service layer for the global leaderboard.
 * Aggregates streak and progress data to rank users.
 */
export const leaderboardService = {
  /**
   * Retrieves the global leaderboard.
   * Joins streak data with user profiles and ranks by the specified field.
   * Results are cached in Redis for 5 minutes.
   * @param query - Leaderboard query options (limit, sortBy)
   * @returns Array of ranked leaderboard entries
   */
  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    const { limit, sortBy } = query;
    const cacheKey = `leaderboard:${sortBy}:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as LeaderboardEntry[];
    }

    const results = await Streak.aggregate([
      { $sort: { [sortBy]: -1, _id: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 0,
          userId: { $toString: '$userId' },
          name: '$user.name',
          avatar: '$user.avatar',
          currentStreak: 1,
          longestStreak: 1,
          totalSolved: 1,
        },
      },
    ]);

    const entries: LeaderboardEntry[] = results.map((doc, index) => ({
      rank: index + 1,
      userId: doc.userId as string,
      name: doc.name as string,
      avatar: doc.avatar as string | undefined,
      currentStreak: doc.currentStreak as number,
      longestStreak: doc.longestStreak as number,
      totalSolved: doc.totalSolved as number,
    }));

    await redis.set(cacheKey, JSON.stringify(entries), 'EX', CACHE_TTL);

    return entries;
  },
};
