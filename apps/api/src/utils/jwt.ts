import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

/** Decoded payload from an access token */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

/** Decoded payload from a refresh token */
export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;
  iat: number;
  exp: number;
}

/**
 * Generates a signed JWT access token.
 * @param payload - User identity data to embed in the token
 * @returns Signed JWT string
 */
export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      jti: uuidv4(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

/**
 * Generates a signed JWT refresh token.
 * @param payload - User ID and token family for rotation tracking
 * @returns Signed JWT string
 */
export function generateRefreshToken(payload: {
  userId: string;
  tokenFamily: string;
}): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tokenFamily: payload.tokenFamily,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
}

/**
 * Verifies and decodes an access token.
 * @param token - JWT string to verify
 * @returns Decoded access token payload
 * @throws AppError.unauthorized if token is invalid or expired
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError
      ? 'Access token has expired'
      : 'Invalid access token';
    throw AppError.unauthorized(message, 'INVALID_ACCESS_TOKEN');
  }
}

/**
 * Verifies and decodes a refresh token.
 * @param token - JWT string to verify
 * @returns Decoded refresh token payload
 * @throws AppError.unauthorized if token is invalid or expired
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError
      ? 'Refresh token has expired'
      : 'Invalid refresh token';
    throw AppError.unauthorized(message, 'INVALID_REFRESH_TOKEN');
  }
}
