import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    pool: 'forks',
    env: {
      NODE_ENV: 'test',
      PORT: '5111',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters-long',
      CLIENT_URL: 'http://localhost:3000',
      COOKIE_DOMAIN: 'localhost',
    },
  },
});
