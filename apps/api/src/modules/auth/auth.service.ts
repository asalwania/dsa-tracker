import type { RegisterInput, LoginInput } from './auth.types.js';

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

/**
 * Service layer for authentication operations.
 * Handles registration, login, token refresh, logout, and OAuth flows.
 */
export const authService = {
  /**
   * Registers a new user with email and password.
   * @param data - Registration input (name, email, password)
   * @returns Auth result with user, access token, and refresh token
   */
  async register(_data: RegisterInput): Promise<AuthResult> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Authenticates a user with email and password.
   * @param data - Login input (email, password)
   * @returns Auth result with user, access token, and refresh token
   */
  async login(_data: LoginInput): Promise<AuthResult> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Refreshes an access token using a valid refresh token.
   * Implements token rotation — the old refresh token is invalidated.
   * @param refreshToken - Current refresh token JWT
   * @returns New auth result with rotated tokens
   */
  async refresh(_refreshToken: string): Promise<AuthResult> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Logs out a user by blacklisting their access token JTI
   * and invalidating the refresh token family.
   * @param accessToken - Current access token JWT
   * @param refreshToken - Current refresh token (from cookie)
   */
  async logout(_accessToken: string, _refreshToken: string): Promise<void> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Handles Google OAuth callback.
   * Creates or updates the user record and generates tokens.
   * @param profile - Google OAuth profile data
   * @returns Auth result with user, access token, and refresh token
   */
  async googleAuth(_profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<AuthResult> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },

  /**
   * Handles GitHub OAuth callback.
   * Creates or updates the user record and generates tokens.
   * @param profile - GitHub OAuth profile data
   * @returns Auth result with user, access token, and refresh token
   */
  async githubAuth(_profile: {
    githubId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<AuthResult> {
    // TODO: implement in auth module prompt
    throw new Error('Not implemented');
  },
};
