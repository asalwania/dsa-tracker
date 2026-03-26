import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type mongoose from 'mongoose';
import app from '../../../app.js';
import { createTestUser, seedTopicAndProblems } from '../../../__tests__/helpers.js';
import type { ITopic } from '../../topics/topics.model.js';
import type { IProblem } from '../../problems/problems.model.js';

let topic: ITopic;
let problems: (mongoose.Document & IProblem)[];

beforeEach(async () => {
  const seed = await seedTopicAndProblems();
  topic = seed.topic;
  problems = seed.problems as (mongoose.Document & IProblem)[];
});

describe('Progress API', () => {
  // ── Toggle ──

  describe('POST /api/progress/toggle', () => {
    it('should mark a problem as solved (200)', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId: String(problems[0]!._id) });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('solved');
      expect(res.body.data.completed).toBe(true);
    });

    it('should toggle solved back to pending', async () => {
      const { accessToken } = await createTestUser();
      const problemId = String(problems[0]!._id);

      // Solve
      await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId });

      // Toggle back
      const res = await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.completed).toBe(false);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/progress/toggle')
        .send({ problemId: String(problems[0]!._id) });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /progress ──

  describe('GET /api/progress', () => {
    it('should return empty array for fresh user', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return all progress for user', async () => {
      const { accessToken } = await createTestUser();

      // Solve two problems
      await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId: String(problems[0]!._id) });

      await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId: String(problems[1]!._id) });

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/progress');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /progress/topic/:topicId ──

  describe('GET /api/progress/topic/:topicId', () => {
    it('should return only that topic progress', async () => {
      const { accessToken } = await createTestUser();

      await request(app)
        .post('/api/progress/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ problemId: String(problems[0]!._id) });

      const res = await request(app)
        .get(`/api/progress/topic/${String(topic._id)}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get(`/api/progress/topic/${String(topic._id)}`);
      expect(res.status).toBe(401);
    });
  });
});
