# DSA Sheet Tracker

A full-stack application for tracking your Data Structures & Algorithms practice progress with streaks, leaderboards, and multi-sheet support.

## Architecture

```
                                    ┌─────────────────────────────────────────────┐
                                    │                  AWS Cloud                  │
                                    │                                             │
  ┌────────┐    ┌──────────────┐    │   ┌─────────┐    ┌──────────────────────┐   │
  │ Client │───▶│  CloudFront  │────┼──▶│   ALB   │───▶│    ECS (API + Web)   │   │
  └────────┘    └──────────────┘    │   └─────────┘    └──────────┬───────────┘   │
                                    │                             │               │
                                    │              ┌──────────────┼────────────┐   │
                                    │              │              │            │   │
                                    │       ┌──────▼───────┐ ┌───▼──────────┐ │   │
                                    │       │ MongoDB Atlas │ │ ElastiCache  │ │   │
                                    │       │  (Primary +   │ │   (Redis)    │ │   │
                                    │       │   Replica)    │ │              │ │   │
                                    │       └──────────────┘ └──────────────┘ │   │
                                    │              └──────────────────────────┘   │
                                    └─────────────────────────────────────────────┘
```

## Prerequisites

| Tool   | Version  | Install                              |
| ------ | -------- | ------------------------------------ |
| Node   | >= 20.x  | [nvm](https://github.com/nvm-sh/nvm) |
| pnpm   | >= 9.x   | `npm install -g pnpm`                |
| Docker | >= 24.x  | [Docker Desktop](https://docker.com) |

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> dsa-tracker && cd dsa-tracker

# 2. Install dependencies
pnpm install

# 3. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Start databases
make db-up

# 5. Wait a few seconds for MongoDB replica set to initialize, then seed
make seed

# 6. Start development servers
make dev
```

The API runs on `http://localhost:5000` and the web app on `http://localhost:3000`.

## Environment Variables

### Backend (`apps/api/.env`)

| Variable                | Purpose                          | Example                                                  |
| ----------------------- | -------------------------------- | -------------------------------------------------------- |
| `NODE_ENV`              | Runtime environment              | `development`                                            |
| `PORT`                  | API server port                  | `5000`                                                   |
| `MONGODB_URI`           | MongoDB connection string        | `mongodb://localhost:27017/dsa-tracker?replicaSet=rs0`   |
| `REDIS_URL`             | Redis connection string          | `redis://localhost:6379`                                 |
| `JWT_ACCESS_SECRET`     | Secret for access tokens         | `your-access-secret-min-32-chars-here`                   |
| `JWT_REFRESH_SECRET`    | Secret for refresh tokens        | `your-refresh-secret-min-32-chars-here`                  |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL                 | `15m`                                                    |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token TTL                | `30d`                                                    |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID           | `your-google-client-id`                                  |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret       | `your-google-client-secret`                              |
| `GOOGLE_CALLBACK_URL`   | Google OAuth callback URL        | `http://localhost:5000/api/auth/google/callback`         |
| `GITHUB_CLIENT_ID`      | GitHub OAuth client ID           | `your-github-client-id`                                  |
| `GITHUB_CLIENT_SECRET`  | GitHub OAuth client secret       | `your-github-client-secret`                              |
| `GITHUB_CALLBACK_URL`   | GitHub OAuth callback URL        | `http://localhost:5000/api/auth/github/callback`         |
| `CLIENT_URL`            | Frontend URL for CORS            | `http://localhost:3000`                                  |
| `COOKIE_DOMAIN`         | Domain for auth cookies          | `localhost`                                              |
| `AWS_REGION`            | AWS region (optional in dev)     | `ap-south-1`                                             |
| `AWS_ACCESS_KEY_ID`     | AWS access key (optional in dev) | -                                                        |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional in dev) | -                                                        |
| `AWS_S3_BUCKET`         | S3 bucket name (optional)        | `dsa-tracker-uploads`                                    |
| `AWS_SQS_QUEUE_URL`     | SQS queue URL (optional)        | -                                                        |

### Frontend (`apps/web/.env`)

| Variable              | Purpose       | Example                        |
| --------------------- | ------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | Backend API   | `http://localhost:5000/api`    |

## Available Scripts

| Command       | Description                     |
| ------------- | ------------------------------- |
| `make dev`    | Start all services in dev mode  |
| `make build`  | Build all packages              |
| `make db-up`  | Start MongoDB + Redis           |
| `make db-down`| Stop MongoDB + Redis            |
| `make seed`   | Seed the database               |
| `make clean`  | Remove all build artifacts      |
| `make lint`   | Lint all packages               |
| `make format` | Format all files with Prettier  |

## Project Structure

```
dsa-tracker/
├── apps/
│   ├── api/                        # Express.js backend
│   │   ├── src/
│   │   │   ├── config/             # Database, Redis, AWS, env config
│   │   │   ├── middleware/         # Auth, validation, rate-limit, cache, errors
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Authentication (JWT + OAuth)
│   │   │   │   ├── users/          # User profiles
│   │   │   │   ├── topics/         # DSA topics/sheets
│   │   │   │   ├── problems/       # DSA problems
│   │   │   │   ├── progress/       # User problem progress
│   │   │   │   ├── streaks/        # Streak tracking
│   │   │   │   └── leaderboard/    # Global leaderboard
│   │   │   ├── utils/              # Logger, errors, JWT, cache helpers
│   │   │   ├── types/              # Global type declarations
│   │   │   ├── scripts/            # Seed scripts
│   │   │   ├── app.ts              # Express app setup
│   │   │   └── server.ts           # Server entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                        # Next.js 15 frontend
│       ├── src/
│       │   ├── app/                # App router pages
│       │   ├── lib/                # Axios, query client, validators
│       │   ├── context/            # Auth context provider
│       │   └── types/              # Shared TypeScript types
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── pnpm-workspace.yaml
├── Makefile
└── package.json
```

## Tech Stack

| Layer     | Technology                                          |
| --------- | --------------------------------------------------- |
| Frontend  | Next.js 15, React 19, TailwindCSS 4, TanStack Query |
| Backend   | Express.js, TypeScript, Zod validation              |
| Database  | MongoDB 7 (replica set) with Mongoose 8             |
| Cache     | Redis 7 with ioredis                                |
| Auth      | JWT (access + refresh) + Google/GitHub OAuth         |
| Infra     | Docker, Turborepo, pnpm workspaces                  |
| Cloud     | AWS (ECS, ALB, CloudFront, S3, SQS, SES)           |

## License

MIT
