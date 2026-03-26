import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { seedTopicAndProblems } from '../../../__tests__/helpers.js';

beforeEach(async () => {
  await seedTopicAndProblems();
});

describe('Topics API', () => {
  describe('GET /api/topics', () => {
    it('should return seeded topics (200)', async () => {
      const res = await request(app).get('/api/topics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].slug).toBe('arrays');
    });
  });

  describe('GET /api/topics/:slug', () => {
    it('should return a single topic by slug (200)', async () => {
      const res = await request(app).get('/api/topics/arrays');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Arrays');
    });

    it('should return 404 for nonexistent slug', async () => {
      const res = await request(app).get('/api/topics/nonexistent-topic');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('No auth required', () => {
    it('should not require authentication for GET /api/topics', async () => {
      const res = await request(app).get('/api/topics');
      expect(res.status).toBe(200);
    });
  });
});
