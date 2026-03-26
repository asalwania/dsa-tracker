import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { createTestUser } from '../../../__tests__/helpers.js';

describe('Auth API', () => {
  // ── Register ──

  describe('POST /api/auth/register', () => {
    it('should register a new user (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'Password1' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email (409)', async () => {
      await createTestUser({ email: 'dup@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'dup@example.com', password: 'Password1' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields (400)', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'no-name@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Weak', email: 'weak@example.com', password: 'short' });

      expect(res.status).toBe(400);
    });
  });

  // ── Login ──

  describe('POST /api/auth/login', () => {
    it('should login successfully (200)', async () => {
      await createTestUser({ email: 'login@example.com', password: 'Password1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject wrong password (401)', async () => {
      await createTestUser({ email: 'wrong@example.com', password: 'Password1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'WrongPass1' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'Password1' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /auth/me ──

  describe('GET /api/auth/me', () => {
    it('should return user with valid token (200)', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBeDefined();
    });

    it('should reject without token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ── Logout ──

  describe('POST /api/auth/logout', () => {
    it('should logout successfully (200)', async () => {
      const { accessToken, refreshTokenCookie } = await createTestUser();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshTokenCookie);

      expect(res.status).toBe(200);
    });

    it('should reject blacklisted access token after logout (401)', async () => {
      const { accessToken, refreshTokenCookie } = await createTestUser();

      // Logout to blacklist the token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshTokenCookie);

      // Try to use the blacklisted token
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
    });
  });
});
