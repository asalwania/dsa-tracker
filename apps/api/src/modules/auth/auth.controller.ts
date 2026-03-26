import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendResponse } from '../../utils/response.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../../utils/cookie.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Controller for authentication endpoints.
 * Handles registration, login, token refresh, logout, and OAuth callbacks.
 */
export const authController = {
  /**
   * POST /api/auth/register
   * Registers a new user and returns tokens.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      sendResponse(
        res,
        201,
        { user: result.user, accessToken: result.accessToken },
        'Registration successful',
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Authenticates a user and returns tokens.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      sendResponse(
        res,
        200,
        { user: result.user, accessToken: result.accessToken },
        'Login successful',
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   * Refreshes the access token using the refresh token cookie.
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.['refreshToken'] as string | undefined;
      if (!refreshToken) {
        throw AppError.unauthorized('No refresh token provided', 'NO_REFRESH_TOKEN');
      }

      const result = await authService.refresh(refreshToken);
      setRefreshTokenCookie(res, result.refreshToken);
      sendResponse(
        res,
        200,
        { user: result.user, accessToken: result.accessToken },
        'Token refreshed successfully',
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Logs out the user by blacklisting tokens and clearing cookies.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const refreshToken = (req.cookies?.['refreshToken'] as string) ?? '';

      if (accessToken || refreshToken) {
        await authService.logout(accessToken, refreshToken);
      }

      clearRefreshTokenCookie(res);
      sendResponse(res, 200, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/google/callback
   * Handles the Google OAuth callback (placeholder for passport integration).
   */
  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a full implementation, passport populates req.user with Google profile
      const profile = req.user as unknown as {
        googleId: string;
        email: string;
        name: string;
        avatar?: string;
      };

      if (!profile) {
        throw AppError.unauthorized('Google authentication failed', 'GOOGLE_AUTH_FAILED');
      }

      const result = await authService.googleAuth(profile);
      setRefreshTokenCookie(res, result.refreshToken);

      // Redirect to client with access token
      const redirectUrl = new URL('/auth/callback', process.env['CLIENT_URL'] ?? 'http://localhost:3000');
      redirectUrl.searchParams.set('token', result.accessToken);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/github/callback
   * Handles the GitHub OAuth callback (placeholder for passport integration).
   */
  async githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = req.user as unknown as {
        githubId: string;
        email: string;
        name: string;
        avatar?: string;
      };

      if (!profile) {
        throw AppError.unauthorized('GitHub authentication failed', 'GITHUB_AUTH_FAILED');
      }

      const result = await authService.githubAuth(profile);
      setRefreshTokenCookie(res, result.refreshToken);

      const redirectUrl = new URL('/auth/callback', process.env['CLIENT_URL'] ?? 'http://localhost:3000');
      redirectUrl.searchParams.set('token', result.accessToken);
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  },
};
