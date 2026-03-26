# DSA Tracker - System Design Document

## 1. HLD - Architecture Diagram (ASCII)

```text
                               +----------------------+
                               |  Users (Web Browser) |
                               +----------+-----------+
                                          |
                                          v
                        +--------------------------------------+
                        | CloudFront CDN (Next.js static/edge) |
                        +----------------+---------------------+
                                         |
                                         v
                         +-------------------------------+
                         | ALB (HTTPS, path-based routes)|
                         +---------------+---------------+
                                         |
                  +----------------------+----------------------+
                  |                                             |
                  v                                             v
        +--------------------------+                 +--------------------------+
        | AZ-1                     |                 | AZ-2                     |
        | ECS Fargate Tasks        |                 | ECS Fargate Tasks        |
        | (Node/Express API)       |                 | (Node/Express API)       |
        +-------------+------------+                 +-------------+------------+
                      \                                          /
                       \                                        /
                        +--------------------------------------+
                        | ECS Service Auto Scaling             |
                        | (target tracking: CPU/RPS/latency)   |
                        +--------------------------------------+
                               |                      |
                               |                      |
                               v                      v
                 +--------------------------+   +--------------------------+
                 | ElastiCache Redis        |   | MongoDB Atlas M10        |
                 | (cache, rate limit,      |   | Replica Set: rs0         |
                 | token blacklist)         |   | Primary + read replicas   |
                 +--------------------------+   +--------------------------+
```

Notes:
- HA is achieved by spreading ECS tasks across 2 Availability Zones.
- API layer is stateless; sessions/tokens are not stored in container memory.
- CloudFront serves static Next.js assets and reduces ALB/API load.

## 2. Request Flow (Browser -> DB -> Browser)

1. Browser requests a page/API.
2. Static assets are served from CloudFront cache when available.
3. Dynamic API request is forwarded to ALB.
4. ALB routes request to a healthy ECS Fargate API task in AZ-1 or AZ-2.
5. API middleware runs security headers, CORS, compression, cookie parsing, rate limiting.
6. If protected route: access JWT is validated; Redis blacklist is checked (`blacklist:<jti>`).
7. Service layer executes business logic.
8. Read path: API checks Redis cache first (topics/problems/leaderboard), then MongoDB on miss.
9. Write path: API writes to MongoDB primary, then invalidates related Redis keys/patterns.
10. API returns JSON response to ALB -> CloudFront -> browser.

## 3. Authentication Mechanism

### Token Model
- Access token: JWT, 15 minutes (`JWT_ACCESS_EXPIRES_IN=15m`), sent in `Authorization: Bearer <token>`.
- Refresh token: JWT, 30 days (`JWT_REFRESH_EXPIRES_IN=30d`), stored in HTTP-only cookie `refreshToken`.

### Login/Register
1. User authenticates via credentials (`/api/auth/login`, `/api/auth/register`) or OAuth callback.
2. API issues:
- Access token with `jti`, `userId`, `email`, `role`.
- Refresh token with `userId`, `tokenFamily`.
3. Refresh token is set as secure HTTP-only cookie (path `/`).

### Refresh + Rotation
1. Client calls `POST /api/auth/refresh` with refresh cookie.
2. API verifies refresh JWT and compares `tokenFamily` with value stored on user.
3. On match: generates a new token family and new token pair (rotation).
4. On mismatch: detects reuse attack, invalidates family (`tokenFamily=''`) and rejects request.

### Logout + Revocation
1. `POST /api/auth/logout` reads access token and refresh cookie.
2. Access token `jti` is blacklisted in Redis with TTL = remaining token lifetime.
3. User `tokenFamily` is cleared, invalidating refresh chain.
4. Refresh cookie is removed.

### OAuth Flow (Google/GitHub)
1. Browser calls `/api/auth/google` or `/api/auth/github`.
2. Passport redirects to provider consent screen.
3. Provider redirects to callback endpoint.
4. API upserts user by provider ID/email, issues token pair, sets refresh cookie.
5. API redirects frontend to `/auth/callback?token=<accessToken>`.

## 4. Progress Tracking Data Flow

Flow: `POST /api/progress/toggle`

1. Auth middleware validates access JWT and user identity.
2. API validates payload (`problemId`, optional `status`, `notes`).
3. Service loads problem to get `topicId`.
4. Progress upsert on `(userId, problemId)`:
- If solved already and toggled solved again -> unsolve (`pending`, `completed=false`).
- Else set new status and completion fields.
5. If final state is solved:
- `streaksService.updateStreak(userId)` runs.
- Recomputes `totalSolved` from Progress.
- Updates `currentStreak`, `longestStreak`, `lastActivityDate`.
6. Cache invalidation:
- Progress/streak endpoints are read-through and should evict user-specific keys if cached.
- Topic/problem caches are invalidated on topic/problem mutation flows.
7. Updated progress is returned to client.

## 5. Scalability Plan (10k-50k Active Users)

- Stateless API containers:
  ECS Fargate tasks remain stateless; scale horizontally via ECS Service Auto Scaling.
- Horizontal scaling:
  Target tracking on CPU/memory/request count keeps p95 latency stable during bursts.
- Redis caching:
  Cache topics/problems/leaderboard with 10-minute TTL (5 min leaderboard).
  Expected DB read reduction target: ~80% for hot catalog endpoints.
- MongoDB indexing:
  Compound indexes for core access patterns:
  `(userId, problemId)` unique and `(userId, topicId)` on `Progress`.
- CloudFront CDN:
  Offloads static Next.js assets and reduces origin/ALB traffic.
- Read replicas:
  Use MongoDB Atlas read replicas/secondary reads for leaderboard-heavy analytical reads.
- Rate limiting:
  Redis-backed sliding-window limiter (global API + stricter login/register) per IP.

## 6. LLD - Database Schema

All collections are in MongoDB Atlas (M10, replica set `rs0`).

### `User`

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | required, trim, min 2, max 50 |
| `email` | String | required, unique, lowercase, email regex |
| `password` | String | optional for OAuth users, min 8, `select:false` |
| `role` | String | enum: `user`, `admin`; default `user` |
| `avatar` | String | default `''` |
| `googleId` | String | sparse index |
| `githubId` | String | sparse index |
| `tokenFamily` | String | current refresh token family id |
| `isActive` | Boolean | default `true` |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

Indexes:
- `{ email: 1 }` unique
- `{ googleId: 1 }` sparse
- `{ githubId: 1 }` sparse

### `Topic`

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `slug` | String | required, unique, lowercase slug regex |
| `title` | String | required, max 100 |
| `description` | String | required, max 500 |
| `order` | Number | required, min 1 |
| `icon` | String | default `''` |
| `totalProblems` | Number | default `0`, min `0` |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

Indexes:
- `{ slug: 1 }` unique
- `{ order: 1 }`

### `Problem`

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `slug` | String | required, unique, lowercase slug regex |
| `title` | String | required, max 200 |
| `topicId` | ObjectId | ref `Topic`, required |
| `difficulty` | String | enum: `easy`,`medium`,`hard` |
| `tags` | [String] | default `[]` |
| `platform` | String | enum: `leetcode`,`gfg`,`codeforces` |
| `problemUrl` | String | required |
| `youtubeUrl` | String | optional |
| `articleUrl` | String | optional |
| `companies` | [String] | default `[]` |
| `order` | Number | required, min 1 |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

Indexes:
- `{ slug: 1 }` unique
- `{ topicId: 1, order: 1 }`
- `{ difficulty: 1 }`
- `{ platform: 1 }`

### `Progress`

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | ref `User`, required |
| `problemId` | ObjectId | ref `Problem`, required |
| `topicId` | ObjectId | ref `Topic`, required |
| `completed` | Boolean | default `false` |
| `status` | String | enum: `solved`,`attempted`,`skipped`,`pending`; default `pending` |
| `notes` | String | max 2000, default `''` |
| `completedAt` | Date/null | set when solved |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

Indexes:
- `{ userId: 1, problemId: 1 }` unique
- `{ userId: 1, topicId: 1 }`
- `{ userId: 1, completed: 1 }`

### `Streak`

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | ref `User`, required, unique |
| `currentStreak` | Number | default `0`, min `0` |
| `longestStreak` | Number | default `0`, min `0` |
| `totalSolved` | Number | default `0`, min `0` |
| `lastActivityDate` | Date/null | UTC day granularity |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

Indexes:
- `{ userId: 1 }` unique
- `{ totalSolved: -1 }`
- `{ currentStreak: -1 }`

### Relationships

- `Problem.topicId -> Topic._id` (many-to-one)
- `Progress.userId -> User._id` (many-to-one)
- `Progress.problemId -> Problem._id` (many-to-one)
- `Progress.topicId -> Topic._id` (many-to-one)
- `Streak.userId -> User._id` (one-to-one logical)

## 7. API Design

Base URL prefix: `/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh` | Refresh cookie | Rotate token pair |
| POST | `/auth/logout` | Optional token/cookie | Revoke session |
| GET | `/auth/me` | Access JWT | Current user profile |
| GET | `/auth/google` | No | Start Google OAuth |
| GET | `/auth/google/callback` | No | Google OAuth callback |
| GET | `/auth/github` | No | Start GitHub OAuth |
| GET | `/auth/github/callback` | No | GitHub OAuth callback |
| GET | `/users/profile` | Access JWT | Get own profile |
| PATCH | `/users/profile` | Access JWT | Update own profile |
| GET | `/users/:id` | Access JWT + admin | Get user by id |
| GET | `/topics` | No | List topics (cached) |
| GET | `/topics/:slug` | No | Get topic by slug (cached) |
| POST | `/topics` | Access JWT + admin | Create topic |
| PUT | `/topics/:id` | Access JWT + admin | Update topic |
| DELETE | `/topics/:id` | Access JWT + admin | Delete topic |
| GET | `/problems` | No | List problems with filters/pagination (cached) |
| GET | `/problems/topic/:topicId` | No | List problems by topic (cached) |
| GET | `/problems/:slug` | No | Get problem by slug (cached) |
| POST | `/problems` | Access JWT + admin | Create problem |
| PUT | `/problems/:id` | Access JWT + admin | Update problem |
| DELETE | `/problems/:id` | Access JWT + admin | Delete problem |
| POST | `/progress/toggle` | Access JWT | Toggle/upsert progress |
| GET | `/progress` | Access JWT | Get all user progress |
| GET | `/progress/topic/:topicId` | Access JWT | Get user progress by topic |
| GET | `/streaks` | Access JWT | Get user streak |
| GET | `/leaderboard` | No | Global leaderboard (cached) |

## 8. Trade-offs

### MongoDB vs SQL
- MongoDB chosen for flexible document evolution (content metadata, notes, OAuth fields) and fast iteration.
- SQL would give stronger relational guarantees and joins; useful if reporting and strict relational consistency dominate.
- Mitigation for MongoDB: enforce constraints with schema validation + compound indexes + id validation in services.

### JWT vs Server Sessions
- JWT chosen for stateless horizontal scaling across ECS tasks and simple cross-service auth propagation.
- Sessions simplify revocation but require sticky/shared session storage and extra coupling.
- Mitigation for JWT revocation gap: Redis JTI blacklist + refresh token family rotation + short access token TTL.

### ECS Fargate vs Lambda
- ECS chosen for predictable long-running Node API behavior, easier connection pooling (Mongo/Redis), and fewer cold-start concerns.
- Lambda can reduce idle cost and scale to zero, but may add latency variance and DB connection management complexity.
- ECS aligns better with sustained traffic profile (10k-50k active users) and operational control needs.
