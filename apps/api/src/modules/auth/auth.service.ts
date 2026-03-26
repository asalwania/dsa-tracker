import { v4 as uuidv4 } from 'uuid';
import type { RegisterInput, LoginInput } from './auth.types.js';
import { User } from '../users/users.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from '../../utils/jwt.js';
import { redis } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';

/** Auth response returned to controllers */
export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

/** Helper to build an AuthResult from a user document */
function buildAuthResult(
  user: { _id: unknown; name: string; email: string; role: string; avatar?: string },
  tokenFamily: string,
): AuthResult {
  const userId = String(user._id);
  const accessToken = generateAccessToken({
    userId,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ userId, tokenFamily });

  return {
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Service layer for authentication operations.
 * Handles registration, login, token refresh, logout, and OAuth flows.
 */
export const authService = {
  /**
   * Registers a new user with email and password.
   */
  async register(data: RegisterInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw AppError.conflict('A user with this email already exists');
    }

    const tokenFamily = uuidv4();
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      tokenFamily,
    });

    return buildAuthResult(user, tokenFamily);
  },

  /**
   * Authenticates a user with email and password.
   */
  async login(data: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user || !user.password) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const tokenFamily = uuidv4();
    user.tokenFamily = tokenFamily;
    await user.save();

    return buildAuthResult(user, tokenFamily);
  },

  /**
   * Refreshes an access token using a valid refresh token.
   * Implements token rotation with family-based reuse detection.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    if (payload.tokenFamily !== user.tokenFamily) {
      user.tokenFamily = '';
      await user.save();
      throw AppError.unauthorized('Token reuse detected');
    }

    const tokenFamily = uuidv4();
    user.tokenFamily = tokenFamily;
    await user.save();

    return buildAuthResult(user, tokenFamily);
  },

  /**
   * Logs out a user by blacklisting their access token JTI
   * and invalidating the refresh token family.
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${payload.jti}`, ttl, '1');
        }
      } catch {
        // Ignore decode errors — logout should succeed gracefully
      }
    }

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.userId);
        if (user) {
          user.tokenFamily = '';
          await user.save();
        }
      } catch {
        // Ignore decode errors — logout should succeed gracefully
      }
    }
  },

  /**
   * Handles Google OAuth callback.
   * Creates or updates the user record and generates tokens.
   */
  async googleAuth(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<AuthResult> {
    let user = await User.findOne({
      $or: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (user) {
      let changed = false;
      if (user.googleId !== profile.googleId) {
        user.googleId = profile.googleId;
        changed = true;
      }
      if (user.name !== profile.name) {
        user.name = profile.name;
        changed = true;
      }
      if (profile.avatar && user.avatar !== profile.avatar) {
        user.avatar = profile.avatar;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      user = await User.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar ?? '',
      });
    }

    const tokenFamily = uuidv4();
    user.tokenFamily = tokenFamily;
    await user.save();

    return buildAuthResult(user, tokenFamily);
  },

  /**
   * Handles GitHub OAuth callback.
   * Creates or updates the user record and generates tokens.
   */
  async githubAuth(profile: {
    githubId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<AuthResult> {
    let user = await User.findOne({
      $or: [{ githubId: profile.githubId }, { email: profile.email }],
    });

    if (user) {
      let changed = false;
      if (user.githubId !== profile.githubId) {
        user.githubId = profile.githubId;
        changed = true;
      }
      if (user.name !== profile.name) {
        user.name = profile.name;
        changed = true;
      }
      if (profile.avatar && user.avatar !== profile.avatar) {
        user.avatar = profile.avatar;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      user = await User.create({
        githubId: profile.githubId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar ?? '',
      });
    }

    const tokenFamily = uuidv4();
    user.tokenFamily = tokenFamily;
    await user.save();

    return buildAuthResult(user, tokenFamily);
  },
};
