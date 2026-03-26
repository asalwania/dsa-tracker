import request from 'supertest';
import app from '../app.js';
import { Topic } from '../modules/topics/topics.model.js';
import { Problem } from '../modules/problems/problems.model.js';

interface TestUser {
  user: { id: string; name: string; email: string; role: string };
  accessToken: string;
  refreshTokenCookie: string;
}

/**
 * Registers a test user via the API and returns credentials.
 */
export async function createTestUser(
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<TestUser> {
  const payload = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `test-${Date.now()}@example.com`,
    password: overrides.password ?? 'Password1',
  };

  const res = await request(app).post('/api/auth/register').send(payload).expect(201);

  const cookies = res.headers['set-cookie'] as string[] | undefined;
  const refreshTokenCookie =
    (Array.isArray(cookies) ? cookies.find((c: string) => c.startsWith('refreshToken=')) : '') ?? '';

  return {
    user: res.body.data.user,
    accessToken: res.body.data.accessToken,
    refreshTokenCookie,
  };
}

/**
 * Seeds 1 topic with 3 problems directly via Mongoose models.
 */
export async function seedTopicAndProblems() {
  const topic = await Topic.create({
    slug: 'arrays',
    title: 'Arrays',
    description: 'Array problems',
    order: 1,
    totalProblems: 3,
  });

  const problems = await Problem.insertMany([
    {
      slug: 'two-sum',
      title: 'Two Sum',
      topicId: topic._id,
      difficulty: 'easy',
      platform: 'leetcode',
      problemUrl: 'https://leetcode.com/problems/two-sum',
      order: 1,
    },
    {
      slug: 'three-sum',
      title: 'Three Sum',
      topicId: topic._id,
      difficulty: 'medium',
      platform: 'leetcode',
      problemUrl: 'https://leetcode.com/problems/3sum',
      order: 2,
    },
    {
      slug: 'max-subarray',
      title: 'Maximum Subarray',
      topicId: topic._id,
      difficulty: 'hard',
      platform: 'leetcode',
      problemUrl: 'https://leetcode.com/problems/maximum-subarray',
      order: 3,
    },
  ]);

  return { topic, problems };
}
