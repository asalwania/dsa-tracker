# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a **pnpm + Turborepo** monorepo with two apps:
- `apps/api` — Express.js REST API (TypeScript, Node 20)
- `apps/web` — Next.js 15 frontend (React 19, Tailwind CSS v4)

Infrastructure: MongoDB 7 (replica set `rs0`) + Redis 7, both managed via Docker Compose.

## Commands

### Development
```bash
make dev          # Start MongoDB + Redis (Docker) then run all apps via turbo
make db-up        # Start only MongoDB + Redis
make db-down      # Stop MongoDB + Redis
```

Run a single app:
```bash
pnpm --filter @dsa-tracker/api dev
pnpm --filter @dsa-tracker/web dev
```

### Build / Lint / Format / Clean
```bash
pnpm turbo build
pnpm turbo lint
pnpm prettier --write .
make clean        # Remove all build artifacts + node_modules
```

### Database
```bash
make seed         # Seed MongoDB with topics and problems
pnpm seed         # Alias: runs seed script directly via tsx
```

MongoDB **requires a replica set** (`rs0`) — the `mongo-init` Docker service handles initialization. Transactions won't work without it.

### Testing
```bash
pnpm --filter @dsa-tracker/api test        # Run all API integration tests
pnpm --filter @dsa-tracker/api test:watch   # Watch mode
npx vitest run src/modules/auth             # Run a single test suite (from apps/api/)
```

Tests use **mongodb-memory-server** (in-memory MongoDB) and a **Map-based Redis mock** (`src/__tests__/setup.ts`). Environment variables for tests are set in `vitest.config.ts` — no `.env` file needed. Tests run sequentially (`fileParallelism: false`) to avoid mongodb-memory-server lock conflicts. Helpers in `src/__tests__/helpers.ts` provide `createTestUser()` and `seedTopicAndProblems()`.

## Environment Setup

Copy `.env.example` files in both apps before running:
- `apps/api/.env` — required: `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `COOKIE_DOMAIN`. OAuth and AWS vars are optional.
- `apps/web/.env` — required: `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`)

## API Architecture (`apps/api`)

**Modules**: `auth`, `users`, `topics`, `problems`, `progress`, `streaks`, `leaderboard` — each under `src/modules/<feature>/` with `model.ts`, `service.ts`, `controller.ts`, `routes.ts`, `types.ts`.

**Request lifecycle**: `helmet → CORS → rate-limit → body/cookie parse → route → validate middleware → controller → service → response util`

Key utilities:
- `src/utils/AppError.ts` — throw `AppError.badRequest()`, `.unauthorized()`, etc. for typed HTTP errors
- `src/utils/response.ts` — use `sendResponse()` / `sendPaginatedResponse()` for consistent response shape
- `src/middleware/validate.ts` — wraps Zod schemas for request body/query/params validation
- `src/middleware/auth.ts` — `authenticate()` verifies JWT + checks Redis blacklist; `authorize(...roles)` for RBAC
- `src/utils/jwt.ts` — access tokens include `jti` (UUID) for blacklisting on logout; refresh tokens include `tokenFamily`
- `src/config/env.ts` — Zod-validated env; process exits on invalid config

**JWT flow**: access token (15m) via Authorization header; refresh token (30d) via HTTP-only cookie. On logout, both tokens are blacklisted in Redis by `jti`.

## Frontend Architecture (`apps/web`)

**Styling**: Tailwind CSS v4 — no `tailwind.config.ts`. Add custom tokens using `@theme` in `src/app/globals.css`.

**Auth state**: `src/context/AuthContext.tsx` — provides `user`, `accessToken`, `isAuthenticated`, `login()`, `register()`, `logout()`, `refreshToken()`. Performs silent refresh on mount.

**HTTP client**: `src/lib/axios.ts` — pre-configured with Bearer token injection and automatic 401 → refresh → retry logic (queue-based to handle concurrent requests). Redirects to `/login` on refresh failure. Use `setAccessToken()` / `getAccessToken()` to manage token state.

**Forms**: use `react-hook-form` + `@hookform/resolvers/zod` + schemas from `src/lib/validators.ts`.

**Server state**: TanStack Query client at `src/lib/queryClient.ts` (5 min stale, 1 retry, no window-focus refetch).

**Utilities**: `src/lib/cn.ts` — `cn()` merges Tailwind classes (clsx + tailwind-merge).

## Ports

- API: `http://localhost:5000` (Express)
- Web: `http://localhost:3000` (Next.js)

## Deployment

Production runs on AWS: ECS (API + Web containers) behind ALB + CloudFront, with MongoDB Atlas and ElastiCache (Redis). See `docker-compose.prod.yml` and individual `Dockerfile`s in each app.
