import { Router } from 'express';
import passport from '../../config/passport.js';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema } from './auth.types.js';
import { env } from '../../config/env.js';

const router = Router();

const CLIENT_URL = env.CLIENT_URL;

/** POST /api/auth/register — Register a new user */
router.post(
  '/register',
  registerLimiter,
  validate({ body: registerSchema }),
  authController.register,
);

/** POST /api/auth/login — Login with email/password */
router.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

/** POST /api/auth/refresh — Refresh access token */
router.post('/refresh', authController.refresh);

/** POST /api/auth/logout — Logout and invalidate tokens */
router.post('/logout', authController.logout);

/** GET /api/auth/me — Get current user profile */
router.get('/me', authenticate, authController.me);

/** GET /api/auth/google — Initiate Google OAuth */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

/** GET /api/auth/google/callback — Google OAuth callback */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
  }),
  authController.googleCallback,
);

/** GET /api/auth/github — Initiate GitHub OAuth */
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false }),
);

/** GET /api/auth/github/callback — GitHub OAuth callback */
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=github_failed`,
  }),
  authController.githubCallback,
);

export default router;
