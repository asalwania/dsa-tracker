import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Environment variables are set via vitest.config.ts `test.env`

// ── Mock Redis with a simple Map-based store ──
const store = new Map<string, { value: string; expiry?: number }>();

function isExpired(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return true;
  if (entry.expiry && Date.now() > entry.expiry) {
    store.delete(key);
    return true;
  }
  return false;
}

const redisMock = {
  get: vi.fn(async (key: string) => {
    if (isExpired(key)) return null;
    return store.get(key)?.value ?? null;
  }),
  set: vi.fn(async (key: string, value: string) => {
    store.set(key, { value });
    return 'OK';
  }),
  setex: vi.fn(async (key: string, ttl: number, value: string) => {
    store.set(key, { value, expiry: Date.now() + ttl * 1000 });
    return 'OK';
  }),
  del: vi.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (store.delete(k)) count++;
    }
    return count;
  }),
  exists: vi.fn(async (key: string) => {
    if (isExpired(key)) return 0;
    return store.has(key) ? 1 : 0;
  }),
  scan: vi.fn(async (_cursor: string, _match: string, pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keys = [...store.keys()].filter((k) => regex.test(k));
    return ['0', keys];
  }),
  expire: vi.fn(async () => 1),
  pipeline: vi.fn(() => {
    const cmds: Array<() => Promise<[null, unknown]>> = [];
    const pipe = {
      zremrangebyscore: () => {
        cmds.push(async () => [null, 0]);
        return pipe;
      },
      zadd: () => {
        cmds.push(async () => [null, 1]);
        return pipe;
      },
      zcard: () => {
        cmds.push(async () => [null, 0]);
        return pipe;
      },
      expire: () => {
        cmds.push(async () => [null, 1]);
        return pipe;
      },
      exec: async () => {
        const results = [];
        for (const cmd of cmds) {
          results.push(await cmd());
        }
        return results;
      },
    };
    return pipe;
  }),
  on: vi.fn(),
  quit: vi.fn(async () => 'OK'),
  status: 'ready',
};

// Mock the redis module before any app code imports it
vi.mock('../config/redis.js', () => ({
  redis: redisMock,
  disconnectRedis: vi.fn(async () => {}),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
  // Clear redis mock store
  store.clear();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
