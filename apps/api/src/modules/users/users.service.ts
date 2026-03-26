import { User, type IUser } from './users.model.js';
import { AppError } from '../../utils/AppError.js';
import type { UpdateProfileInput } from './users.types.js';

/**
 * Service layer for user operations.
 */
export const usersService = {
  /**
   * Retrieves a user's public profile by their ID.
   * @param userId - The user's MongoDB ObjectId
   * @returns User document without sensitive fields
   * @throws AppError.notFound if the user does not exist
   */
  async getProfile(userId: string): Promise<IUser> {
    // TODO: implement in auth module prompt
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  },

  /**
   * Updates the authenticated user's profile.
   * @param userId - The user's MongoDB ObjectId
   * @param data - Partial profile update data
   * @returns The updated user document
   * @throws AppError.notFound if the user does not exist
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    // TODO: implement in auth module prompt
    const user = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  },

  /**
   * Retrieves a user by ID (admin only — returns full profile).
   * @param id - The target user's MongoDB ObjectId
   * @returns User document
   * @throws AppError.notFound if the user does not exist
   */
  async getById(id: string): Promise<IUser> {
    // TODO: implement in auth module prompt
    const user = await User.findById(id);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  },
};
