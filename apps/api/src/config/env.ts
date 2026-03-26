import { z } from 'zod';

/**
 * Zod schema for validating all environment variables.
 * AWS credentials are optional in development.
 */
const envSchema = z.object({
  /** Runtime environment */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  /** Port the API server listens on */
  PORT: z.coerce.number().int().positive().default(5000),

  /** MongoDB connection URI (must include replicaSet for transactions) */
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  /** Redis connection URL */
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  /** JWT secret for signing access tokens (min 32 chars) */
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),

  /** JWT secret for signing refresh tokens (min 32 chars) */
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  /** Access token expiration (e.g. "15m", "1h") */
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),

  /** Refresh token expiration (e.g. "30d", "7d") */
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('30d'),

  /** Google OAuth client ID */
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  /** Google OAuth client secret */
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  /** Google OAuth callback URL */
  GOOGLE_CALLBACK_URL: z.string().url('GOOGLE_CALLBACK_URL must be a valid URL'),

  /** GitHub OAuth client ID */
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),

  /** GitHub OAuth client secret */
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),

  /** GitHub OAuth callback URL */
  GITHUB_CALLBACK_URL: z.string().url('GITHUB_CALLBACK_URL must be a valid URL'),

  /** Frontend URL for CORS origin */
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),

  /** Cookie domain for auth cookies */
  COOKIE_DOMAIN: z.string().min(1).default('localhost'),

  /** AWS region (optional in development) */
  AWS_REGION: z.string().default('ap-south-1'),

  /** AWS access key ID (optional — empty string disables AWS) */
  AWS_ACCESS_KEY_ID: z.string().default(''),

  /** AWS secret access key (optional — empty string disables AWS) */
  AWS_SECRET_ACCESS_KEY: z.string().default(''),

  /** S3 bucket name (optional) */
  AWS_S3_BUCKET: z.string().default(''),

  /** SQS queue URL (optional) */
  AWS_SQS_QUEUE_URL: z.string().default(''),
});

/** Inferred type from the env schema */
export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  → ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

/** Validated and typed environment variables */
export const env: Env = Object.freeze(parsed.data);
