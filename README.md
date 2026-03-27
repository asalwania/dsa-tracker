<div align="center">

# DSA Tracker

**Track your Data Structures & Algorithms progress — all in one place.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white&style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white&style=flat-square)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white&style=flat-square)](https://redis.io)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white&style=flat-square)](https://pnpm.io)

Mark problems solved, build streaks, climb the leaderboard.

</div>

---

## Features

- **Problem tracking** — Mark problems as solved/unsolved across DSA topics
- **Streak system** — Daily streaks to keep you consistent
- **Leaderboard** — See how you rank globally
- **Auth** — Email/password, Google OAuth, and GitHub OAuth
- **JWT security** — Short-lived access tokens + Redis-blacklisted refresh tokens

---

## Architecture

```
                                ┌─────────────────────────────────────────────┐
                                │                  AWS Cloud                  │
                                │                                             │
  ┌────────┐  ┌──────────────┐  │  ┌─────────┐   ┌──────────────────────────┐ │
  │ Client │─▶│  CloudFront  │──┼─▶│   ALB   │──▶│    ECS (API + Web)       │ │
  └────────┘  └──────────────┘  │  └─────────┘   └────────────┬─────────────┘ │
                                │                             │               │
                                │              ┌──────────────┴────────────┐  │
                                │       ┌──────▼───────┐  ┌───────────────▼┐  │
                                │       │ MongoDB Atlas │  │ ElastiCache    │  │
                                │       │  (replica set)│  │   (Redis)      │  │
                                │       └──────────────┘  └───────────────┘   │
                                └─────────────────────────────────────────────┘
```

**Local dev:** Docker runs MongoDB (replica set `rs0`) + Redis. Turborepo runs both apps together.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, TanStack Query |
| Backend | Express.js, TypeScript, Node 20, Zod |
| Database | MongoDB 7 (replica set) with Mongoose 8 |
| Cache / Auth | Redis 7 (JWT blacklisting) |
| Auth | JWT (access + refresh tokens), Google OAuth, GitHub OAuth |
| Monorepo | pnpm workspaces + Turborepo |
| Cloud | AWS ECS, ALB, CloudFront, S3, SQS |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | >= 20 | [nvm](https://github.com/nvm-sh/nvm) |
| pnpm | >= 9 | `npm install -g pnpm` |
| Docker | >= 24 | [Docker Desktop](https://www.docker.com/products/docker-desktop) |

---

## Quick Start

### 1 — Clone & install

```bash
git clone <repo-url> dsa-tracker
cd dsa-tracker
pnpm install
```

### 2 — Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and set at minimum:

```env
JWT_ACCESS_SECRET=<random-string-min-32-chars>
JWT_REFRESH_SECRET=<random-string-min-32-chars>
```

Everything else works out of the box for local development.

### 3 — Start the database

```bash
make db-up
```

Starts MongoDB (with replica set `rs0`) and Redis via Docker. Wait a few seconds for the replica set to initialize.

### 4 — Seed

```bash
make seed
```

### 5 — Run

```bash
make dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:5000 |

---

## Environment Variables

### `apps/api/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB URI with replica set, e.g. `mongodb://localhost:27017/dsa-tracker?replicaSet=rs0` |
| `REDIS_URL` | Yes | — | Redis URL, e.g. `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Yes | — | Min 32 chars |
| `JWT_REFRESH_SECRET` | Yes | — | Min 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token TTL |
| `CLIENT_URL` | Yes | — | Frontend origin for CORS, e.g. `http://localhost:3000` |
| `COOKIE_DOMAIN` | Yes | — | Cookie domain, e.g. `localhost` |
| `PORT` | No | `5000` | API server port |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth (optional) |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth (optional) |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth (optional) |
| `AWS_*` | No | — | AWS credentials for S3/SQS (optional) |

### `apps/web/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000/api` | API base URL |

---

## Commands

### Makefile

```bash
make dev        # Start DB (Docker) + run all apps in dev mode
make db-up      # Start MongoDB + Redis only
make db-down    # Stop MongoDB + Redis
make seed       # Seed DB with topics and problems
make clean      # Remove all build artifacts + node_modules
```

### pnpm / Turborepo

```bash
pnpm dev        # Run all apps in dev mode
pnpm build      # Build all apps
pnpm lint       # Lint all apps
pnpm format     # Format code with Prettier
```

### Per-app

```bash
pnpm --filter @dsa-tracker/api dev   # API only
pnpm --filter @dsa-tracker/web dev  # Web only
```

---

## Testing

Tests run against an **in-memory MongoDB** and a **Map-based Redis mock** — no running services needed.

```bash
# All API tests
pnpm --filter @dsa-tracker/api test

# Watch mode
pnpm --filter @dsa-tracker/api test:watch

# Single test suite (run from apps/api/)
npx vitest run src/modules/auth
```

---

## Project Structure

```
dsa-tracker/
├── apps/
│   ├── api/                         # Express.js REST API
│   │   └── src/
│   │       ├── config/              # DB, Redis, env (Zod-validated)
│   │       ├── middleware/          # Auth, validation, rate-limit
│   │       ├── modules/
│   │       │   ├── auth/            # JWT + OAuth
│   │       │   ├── users/           # Profiles
│   │       │   ├── topics/          # DSA topic sheets
│   │       │   ├── problems/        # Individual problems
│   │       │   ├── progress/        # Solved/unsolved tracking
│   │       │   ├── streaks/         # Daily streaks
│   │       │   └── leaderboard/     # Rankings
│   │       └── utils/               # AppError, response helpers, JWT
│   └── web/                         # Next.js 15 frontend
│       └── src/
│           ├── app/                 # App router pages
│           ├── context/             # AuthContext (silent refresh)
│           ├── lib/                 # Axios (token injection + retry), TanStack Query
│           └── types/
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── pnpm-workspace.yaml
├── Makefile
└── package.json
```

---

## API Overview

All endpoints are under `/api`. Auth uses `Authorization: Bearer <token>`.

| Module | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, logout, OAuth, refresh |
| Users | `/api/users` | Profile management |
| Topics | `/api/topics` | DSA topic sheets |
| Problems | `/api/problems` | Problems within topics |
| Progress | `/api/progress` | Mark problems solved/unsolved |
| Streaks | `/api/streaks` | Streak data |
| Leaderboard | `/api/leaderboard` | Global rankings |

**Token flow:**
- Access token: 15 min, sent via `Authorization` header
- Refresh token: 30 days, HTTP-only cookie, blacklisted in Redis on logout

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: describe your change'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT
