import type { Response, CookieOptions } from 'express';
import { env } from '../config/env.js';

/** 30 days in milliseconds */
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function isIpAddress(value: string): boolean {
  const v = value.trim();
  return (
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(v) ||
    (v.startsWith('[') && v.endsWith(']')) ||
    v.includes(':')
  );
}

function isHttpsClientUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Domain attribute is invalid on localhost and can cause cookies to be dropped. */
function shouldSetCookieDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== 'localhost' &&
    normalized !== '127.0.0.1' &&
    !isIpAddress(normalized)
  );
}

/** Shared cookie options for the refresh token */
function getCookieOptions(path: string): CookieOptions {
  const secureCookies = env.NODE_ENV === 'production' && isHttpsClientUrl(env.CLIENT_URL);
  const options: CookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    // Cross-site cookies require SameSite=None + Secure (HTTPS only).
    sameSite: secureCookies ? ('none' as const) : ('lax' as const),
    path,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  };

  if (shouldSetCookieDomain(env.COOKIE_DOMAIN)) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

/** Cookie options for clearing refresh token cookies */
function getClearCookieOptions(path: string): CookieOptions {
  const options = getCookieOptions(path);
  delete options.maxAge;
  return options;
}

/**
 * Sets the refresh token as an HTTP-only cookie on the response.
 * @param res - Express response object
 * @param token - Refresh token JWT string
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  // Clear legacy scoped cookie to avoid duplicate refreshToken cookies across paths.
  res.clearCookie('refreshToken', getClearCookieOptions('/api/auth'));

  // Must be visible on app routes so Next middleware can detect active sessions.
  res.cookie('refreshToken', token, getCookieOptions('/'));
}

/**
 * Clears the refresh token cookie from the response.
 * @param res - Express response object
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', getClearCookieOptions('/'));
  // Remove previously scoped cookie for compatibility with older deployments.
  res.clearCookie('refreshToken', getClearCookieOptions('/api/auth'));
}
