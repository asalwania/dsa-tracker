import type { Response } from 'express';
import { env } from '../config/env.js';

/** 30 days in milliseconds */
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/** Shared cookie options for the refresh token */
function getCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  path: string;
  maxAge: number;
  domain: string;
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV !== 'development',
    sameSite: 'strict' as const,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    domain: env.COOKIE_DOMAIN,
  };
}

/**
 * Sets the refresh token as an HTTP-only cookie on the response.
 * @param res - Express response object
 * @param token - Refresh token JWT string
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, getCookieOptions());
}

/**
 * Clears the refresh token cookie from the response.
 * @param res - Express response object
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV !== 'development',
    sameSite: 'strict' as const,
    path: '/api/auth',
    domain: env.COOKIE_DOMAIN,
  });
}
