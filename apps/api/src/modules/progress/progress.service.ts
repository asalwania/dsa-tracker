import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { Problem } from '../problems/problems.model.js';
import { streaksService } from '../streaks/streaks.service.js';
import { Progress, type IProgress, type ProgressStatus } from './progress.model.js';
import type { ToggleProgressInput } from './progress.types.js';

/**
 * Ensures a string is a valid Mongo ObjectId.
 */
function assertValidObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw AppError.badRequest(`${fieldName} must be a valid ObjectId`, 'INVALID_ID');
  }
}

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
  async toggleProblem(userId: string, data: ToggleProgressInput): Promise<IProgress> {
    assertValidObjectId(userId, 'userId');
    assertValidObjectId(data.problemId, 'problemId');

    const problem = await Problem.findById(data.problemId)
      .select('_id topicId')
      .lean<{ _id: mongoose.Types.ObjectId; topicId: mongoose.Types.ObjectId }>();

    if (!problem) {
      throw AppError.notFound(`Problem with id '${data.problemId}' not found`, 'PROBLEM_NOT_FOUND');
    }

    const existingProgress = await Progress.findOne({
      userId,
      problemId: data.problemId,
    }).lean<IProgress | null>();

    const requestedStatus: ProgressStatus = data.status ?? 'solved';
    const shouldUnsolve =
      requestedStatus === 'solved' &&
      existingProgress?.status === 'solved' &&
      existingProgress.completed;

    const nextStatus: ProgressStatus = shouldUnsolve ? 'pending' : requestedStatus;
    const isCompleted = nextStatus === 'solved';
    const nextNotes = data.notes ?? existingProgress?.notes ?? '';

    const progress = await Progress.findOneAndUpdate(
      {
        userId,
        problemId: data.problemId,
      },
      {
        $set: {
          topicId: problem.topicId,
          completed: isCompleted,
          status: nextStatus,
          notes: nextNotes,
          completedAt: isCompleted ? new Date() : null,
        },
        $setOnInsert: {
          userId,
          problemId: data.problemId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean<IProgress>();

    if (!progress) {
      throw AppError.internal('Failed to update progress', 'PROGRESS_UPDATE_FAILED');
    }

    if (isCompleted) {
      await streaksService.updateStreak(userId);
    }

    return progress;
  },

  /**
   * Retrieves all progress entries for a user.
   * @param userId - The user's MongoDB ObjectId
   * @returns Array of progress documents
   */
  async getUserProgress(userId: string): Promise<IProgress[]> {
    assertValidObjectId(userId, 'userId');

    return Progress.find({ userId }).sort({ updatedAt: -1 }).lean<IProgress[]>();
  },

  /**
   * Retrieves progress entries for a user within a specific topic.
   * @param userId - The user's MongoDB ObjectId
   * @param topicId - The topic's MongoDB ObjectId
   * @returns Array of progress documents for the topic
   */
  async getTopicProgress(userId: string, topicId: string): Promise<IProgress[]> {
    assertValidObjectId(userId, 'userId');
    assertValidObjectId(topicId, 'topicId');

    return Progress.find({ userId, topicId }).sort({ updatedAt: -1 }).lean<IProgress[]>();
  },
};
