import { Progress } from '../progress/progress.model.js';
import { Streak, type IStreak } from './streaks.model.js';

/**
 * Returns today's date with time zeroed out (UTC midnight).
 */
function toUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

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
  async getUserStreak(userId: string): Promise<IStreak> {
    const streak = await Streak.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true },
    );
    return streak;
  },

  /**
   * Updates a user's streak after they solve a problem.
   * Called internally by the progress service.
   *
   * Logic:
   * - If lastActivityDate is today: no change to streak count
   * - If lastActivityDate is yesterday: increment currentStreak
   * - Otherwise: reset currentStreak to 1
   * - Always update lastActivityDate = today
   * - Always recalculate totalSolved from Progress collection
   *
   * @param userId - The user's MongoDB ObjectId
   * @returns Updated streak document
   */
  async updateStreak(userId: string): Promise<IStreak> {
    const today = toUTCDay(new Date());
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const totalSolved = await Progress.countDocuments({ userId, completed: true });

    const existing = await Streak.findOne({ userId });

    if (!existing) {
      return Streak.findOneAndUpdate(
        { userId },
        {
          $set: {
            currentStreak: 1,
            longestStreak: 1,
            totalSolved,
            lastActivityDate: today,
          },
          $setOnInsert: { userId },
        },
        { new: true, upsert: true },
      ) as Promise<IStreak>;
    }

    const last = existing.lastActivityDate ? toUTCDay(existing.lastActivityDate) : null;
    const isToday = last !== null && last.getTime() === today.getTime();
    const isYesterday = last !== null && last.getTime() === yesterday.getTime();

    let newCurrentStreak: number;
    if (isToday) {
      newCurrentStreak = existing.currentStreak;
    } else if (isYesterday) {
      newCurrentStreak = existing.currentStreak + 1;
    } else {
      newCurrentStreak = 1;
    }

    const newLongest = Math.max(existing.longestStreak, newCurrentStreak);

    const updated = await Streak.findOneAndUpdate(
      { userId },
      {
        $set: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongest,
          totalSolved,
          lastActivityDate: today,
        },
      },
      { new: true },
    );

    return updated as IStreak;
  },
};
