import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema } from './auth.types.js';

const router = Router();

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

/** GET /api/auth/google — Initiate Google OAuth (passport redirect) */
router.get('/google', (_req, res) => {
  // Placeholder: passport.authenticate('google', { scope: ['profile', 'email'] })
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Google OAuth not configured' } });
});

/** GET /api/auth/google/callback — Google OAuth callback */
router.get('/google/callback', authController.googleCallback);

/** GET /api/auth/github — Initiate GitHub OAuth (passport redirect) */
router.get('/github', (_req, res) => {
  // Placeholder: passport.authenticate('github', { scope: ['user:email'] })
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'GitHub OAuth not configured' } });
});

/** GET /api/auth/github/callback — GitHub OAuth callback */
router.get('/github/callback', authController.githubCallback);

export default router;
