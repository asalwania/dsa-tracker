# DSA Tracker — System Design Document

> **Target scale**: 10k–50k daily active users (DAU)
> **Stack**: Next.js 15 · Express.js · MongoDB 7 · Redis 7 · AWS (ECS Fargate)

---

## Table of Contents

1. [Requirements & Constraints](#1-requirements--constraints)
2. [High-Level Architecture (HLD)](#2-high-level-architecture-hld)
3. [Request Flow](#3-request-flow)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Progress Tracking Data Flow](#5-progress-tracking-data-flow)
6. [Database Schema (LLD)](#6-database-schema-lld)
7. [API Design](#7-api-design)
8. [Caching Strategy](#8-caching-strategy)
9. [Capacity Estimation](#9-capacity-estimation)
10. [Scalability & Performance](#10-scalability--performance)
11. [Security Considerations](#11-security-considerations)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Failure Modes & Resilience](#13-failure-modes--resilience)
14. [Trade-offs & Design Decisions](#14-trade-offs--design-decisions)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Requirements & Constraints

### Functional Requirements

| # | Requirement | Priority |
|---|---|---|
| F1 | Secure authentication (email/password + OAuth) | P0 |
| F2 | Browse DSA topics and problems (structured sheet) | P0 |
| F3 | Per-problem learning resources (YouTube, LeetCode, articles) | P0 |
| F4 | Difficulty tagging (Easy / Medium / Hard) | P0 |
| F5 | Progress tracking with checkbox (persists across sessions) | P0 |
| F6 | Streak tracking (current, longest, activity heatmap) | P1 |
| F7 | Global leaderboard (most solved, longest streak) | P1 |
| F8 | Admin CRUD for topics and problems | P2 |

### Non-Functional Requirements

| # | Requirement | Target |
|---|---|---|
| NF1 | Availability | 99.9% uptime (< 8.7h downtime/year) |
| NF2 | Latency | p95 API response < 200ms |
| NF3 | Throughput | Handle 500 req/sec sustained, 2k peak |
| NF4 | Data durability | No progress loss; MongoDB replica set |
| NF5 | Security | OWASP Top 10 mitigated, zero plaintext secrets |
| NF6 | Scalability | Horizontal, zero-downtime deploys |

### Assumptions

- Read-heavy workload (~90% reads: browsing topics/problems, 10% writes: toggling progress)
- Problem catalog is relatively static (~150 problems, updated weekly at most)
- Peak traffic during evening hours (IST 7pm–11pm) and weekends
- Single region deployment (ap-south-1) is sufficient for initial user base

---

## 2. High-Level Architecture (HLD)

```text
                            ┌─────────────────────┐
                            │   Users (Browser)   │
                            └──────────┬──────────┘
                                       │ HTTPS
                                       ▼
                         ┌──────────────────────────┐
                         │   AWS CloudFront CDN     │
                         │ (static assets, edge     │
                         │ caching, SSL termination)│
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   Application Load       │
                         │   Balancer (ALB)         │
                         │  ┌──────────────────────┐│
                         │  │ /api/* → API Target  ││
                         │  │ /*     → Web Target  ││
                         │  └──────────────────────┘│
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼───────────────────┐
                    │                 │                   │
                    ▼                 ▼                   ▼
           ┌───────────────┐  ┌───────────────┐   ┌──────────────┐
           │  AZ-1 (a)     │  │  AZ-2 (b)     │   │  AZ-1 / AZ-2 │
           │               │  │               │   │              │
           │ ┌──────────┐  │  │ ┌──────────┐  │   │ ┌──────────┐ │
           │ │ API Task │  │  │ │ API Task │  │   │ │ Web Task │ │
           │ │ (Express)│  │  │ │ (Express)│  │   │ │ (Next.js)│ │
           │ └─────┬────┘  │  │ └─────┬────┘  │   │ └──────────┘ │
           └───────┼───────┘  └───────┼───────┘   └──────────────┘
                   │                 │
        ┌──────────┴─────────────────┴───────────┐
        │                                        │
        ▼                                        ▼
 ┌────────────────────┐              ┌────────────────────────┐
 │  ElastiCache Redis │              │  MongoDB Atlas M10     │
 │  (t3.micro)        │              │  Replica Set (rs0)     │
 │                    │              │                        │
 │  • Token blacklist │              │  • Primary (writes)    │
 │  • API cache       │              │  • Secondary (reads)   │
 │  • Rate limiter    │              │  • VPC Peering         │
 │  • Session data    │              │                        │
 └────────────────────┘              └────────────────────────┘
```

### Component Responsibilities

| Component | Role | Why |
|---|---|---|
| **CloudFront** | CDN, SSL termination, static caching | Reduces ALB load by ~60% for static assets |
| **ALB** | Path-based routing, health checks, TLS | Distributes traffic across ECS tasks |
| **ECS Fargate (API)** | Business logic, auth, data access | Stateless, auto-scaling, no server management |
| **ECS Fargate (Web)** | Next.js SSR/SSG, client app | Standalone output, optimized Docker image |
| **Redis** | Cache, rate-limit, token blacklist | Sub-ms reads, TTL-based expiry |
| **MongoDB Atlas** | Persistent storage, replica set | Document model fits hierarchical DSA data |

---

## 3. Request Flow

### Read Path (e.g., GET /api/topics)

```text
Browser ──► CloudFront ──► ALB ──► ECS API Task
                                       │
                                       ├─► Redis cache HIT? → Return cached JSON
                                       │
                                       └─► Redis MISS → MongoDB query
                                                          │
                                                          ├─► Write to Redis (TTL: 10m)
                                                          └─► Return JSON
```

### Write Path (e.g., POST /api/progress/toggle)

```text
Browser ──► ALB ──► ECS API Task
                        │
                        ├─► Validate JWT (check Redis blacklist)
                        ├─► Validate request body (Zod schema)
                        ├─► MongoDB upsert (Progress collection)
                        ├─► Update Streak (if solved)
                        ├─► Invalidate related Redis cache keys
                        └─► Return updated progress
```

### Middleware Pipeline

```text
Request → helmet → CORS → compression → rate-limit → cookie-parser
        → body-parser → route matching → validate(schema) → authenticate
        → authorize(roles) → controller → service → response
```

Each middleware is fail-fast: a rejected rate-limit or invalid JWT short-circuits the pipeline and returns an appropriate HTTP error before hitting the database.

---

## 4. Authentication & Authorization

### Token Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    JWT Token Model                        │
├───────────────────────┬───────────────────────────────────┤
│  Access Token         │  Refresh Token                    │
│  ─────────────        │  ─────────────                    │
│  Lifetime: 15 min     │  Lifetime: 30 days                │
│  Transport: Auth      │  Transport: HTTP-only cookie      │
│    header (Bearer)    │    (Secure, SameSite=Strict)      │
│  Payload: userId,     │  Payload: userId, tokenFamily     │
│    email, role, jti   │                                   │
│  Revocation: Redis    │  Revocation: tokenFamily rotation │
│    blacklist by jti   │    on User document               │
└───────────────────────┴───────────────────────────────────┘
```

### Login Flow

```text
Client                        API                         Redis/MongoDB
  │                            │                               │
  │── POST /auth/login ───────►│                               │
  │   {email, password}        │── bcrypt.compare() ──────────►│ MongoDB
  │                            │◄── user doc ──────────────────│
  │                            │── generate tokenFamily ──────►│ MongoDB (save)
  │                            │── sign access JWT (jti) ─────►│
  │                            │── sign refresh JWT ──────────►│
  │◄── { accessToken } ────────│                               │
  │◄── Set-Cookie: refresh ────│                               │
```

### Refresh + Rotation (Replay Attack Prevention)

```text
Client                        API                         Redis/MongoDB
  │                            │                               │
  │── POST /auth/refresh ─────►│                               │
  │   Cookie: refreshToken     │── verify JWT ────────────────►│
  │                            │── check tokenFamily match ───►│ MongoDB
  │                            │                               │
  │                      ┌─────┤ Match?                        │
  │                      │ YES │── rotate: new tokenFamily ───►│ MongoDB
  │                      │     │── issue new token pair ──────►│
  │◄─── new tokens ──────┤     │                               │
  │                      │ NO  │── REUSE DETECTED              │
  │                      │     │── clear tokenFamily ─────────►│ MongoDB
  │◄─── 401 Forbidden ───┘     │   (invalidate ALL sessions)   │
```

**Why token family rotation?** If an attacker steals a refresh token and uses it, the legitimate user's next refresh attempt will fail (family mismatch), triggering full revocation. This limits the window of a stolen refresh token to a single use.

### OAuth Flow (Google / GitHub)

```text
Browser ──► /api/auth/google ──► Google consent screen
                                       │
                                       ▼
        /api/auth/google/callback ◄── Google redirect
              │
              ├─► Passport: findOrCreate user by googleId/email
              ├─► Issue token pair (same as login flow)
              └─► Redirect to /auth/callback?token=<accessToken>
                       │
                       ▼
              Next.js callback page stores token → AuthContext
```

### RBAC Model

| Role | Permissions |
|---|---|
| `user` | Browse topics/problems, toggle progress, view streaks/leaderboard |
| `admin` | All user permissions + CRUD topics/problems + view any user |

Authorization is enforced by `authorize(...roles)` middleware after authentication.

---

## 5. Progress Tracking Data Flow

### Toggle Progress (Core Feature)

```text
  ┌─────────┐         ┌──────────┐        ┌─────────┐       ┌─────────┐
  │ Browser │         │   API    │        │ MongoDB │       │  Redis  │
  └────┬────┘         └────┬─────┘        └────┬────┘       └────┬────┘
       │                   │                   │                 │
       │─ POST /progress/toggle ──►            │                 │
       │  {problemId, status}                  │                 │
       │                   │                   │                 │
       │                   │── validate JWT ──►│                 │
       │                   │◄── user context ──│                 │
       │                   │                   │                 │
       │                   │── lookup Problem ─►                 │
       │                   │◄── {topicId} ─────│                 │
       │                   │                   │                 │
       │                   │── upsert Progress ►                 │
       │                   │   (userId+problemId)                │
       │                   │◄── updated doc ───│                 │
       │                   │                   │                 │
       │            [if solved]                │                 │
       │                   │── count solved ───►                 │
       │                   │◄── totalSolved ───│                 │
       │                   │                   │                 │
       │                   │── upsert Streak ──►                 │
       │                   │  (current, longest,│                │
       │                   │   totalSolved,     │                │
       │                   │   lastActivityDate)│                │
       │                   │                   │                 │
       │                   │── invalidate ──────────────────────►│
       │                   │   cache patterns  │                 │
       │                   │                   │                 │
       │◄── {progress} ───│                    │                  │
```

### State Machine

```text
                  toggle(solved)
    ┌──────────┐ ──────────────► ┌──────────┐
    │ pending  │                 │  solved   │
    └──────────┘ ◄────────────── └──────────┘
                  toggle(solved)

    Other transitions via explicit status:
    pending ──► attempted ──► solved
    pending ──► skipped
    any    ──► pending (reset)
```

### Resume on Login

When a user logs in, the client fetches `GET /api/progress` which returns all `Progress` documents for that user. The frontend reconstructs checkbox state from this data — no additional "resume" endpoint is needed.

---

## 6. Database Schema (LLD)

### Entity-Relationship Diagram

```text
  ┌──────────┐        ┌──────────────┐        ┌───────────┐
  │  User    │        │   Progress   │        │  Problem  │
  │──────────│        │──────────────│        │───────────│
  │ _id (PK) │◄──┐    │ _id (PK)     │   ┌───►│ _id (PK)  │
  │ name     │   │    │ userId (FK)──┼───┘    │ slug      │
  │ email    │   │    │ problemId(FK)┼────────►│ title    │
  │ password │   │    │ topicId (FK) ┼──┐     │ topicId───┼──┐
  │ role     │   │    │ completed    │  │     │ difficulty│  │
  │ avatar   │   │    │ status       │  │     │ tags      │  │
  │ googleId │   │    │ notes        │  │     │ platform  │  │
  │ githubId │   │    │ completedAt  │  │     │ problemUrl│  │
  │ tokenFam │   │    └──────────────┘  │     │ youtubeUrl│  │
  │ isActive │   │                      │     │ articleUrl│  │
  └──────────┘   │    ┌──────────────┐  │     │ companies │  │
                 │    │   Streak     │  │     │ order     │  │
  ┌──────────┐   │    │──────────────│  │     └───────────┘  │
  │  Topic   │   │    │ _id (PK)     │  │                    │
  │──────────│   │    │ userId (FK)──┼──┘                    │
  │ _id (PK) │◄──┼────│ currentStr   │                       │
  │ slug     │   │    │ longestStr   │                       │
  │ title    │   │    │ totalSolved  │                       │
  │ descript │   │    │ lastActivity │                       │
  │ order    │   │    └──────────────┘                       │
  │ icon     │   │                                           │
  │ totalProb│   └───────────────────────────────────────────┘
  └──────────┘
```

### Collection Schemas

#### `users`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | required, trim, 2–50 chars |
| `email` | String | required, **unique**, lowercase |
| `password` | String | optional (OAuth users), min 8, `select: false` |
| `role` | String | enum: `user` \| `admin`, default: `user` |
| `avatar` | String | default: `''` |
| `googleId` | String | sparse unique (OAuth) |
| `githubId` | String | sparse unique (OAuth) |
| `tokenFamily` | String | current refresh token family UUID |
| `isActive` | Boolean | default: `true` |
| timestamps | — | `createdAt`, `updatedAt` (auto) |

**Indexes**: `{ email: 1 }` unique, `{ googleId: 1 }` sparse, `{ githubId: 1 }` sparse

#### `topics`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `slug` | String | required, **unique**, lowercase, URL-safe |
| `title` | String | required, max 100 |
| `description` | String | required, max 500 |
| `order` | Number | required, min 1 (display order) |
| `icon` | String | emoji or icon key |
| `totalProblems` | Number | default: 0, min: 0 |
| timestamps | — | auto |

**Indexes**: `{ slug: 1 }` unique, `{ order: 1 }`

#### `problems`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `slug` | String | required, **unique**, lowercase |
| `title` | String | required, max 200 |
| `topicId` | ObjectId | ref → `topics`, required |
| `difficulty` | String | enum: `easy` \| `medium` \| `hard` |
| `tags` | [String] | default: `[]` |
| `platform` | String | enum: `leetcode` \| `gfg` \| `codeforces` |
| `problemUrl` | String | required (practice link) |
| `youtubeUrl` | String | optional (video tutorial) |
| `articleUrl` | String | optional (theory reference) |
| `companies` | [String] | default: `[]` (e.g., Google, Amazon) |
| `order` | Number | required, min 1 (within topic) |
| timestamps | — | auto |

**Indexes**: `{ slug: 1 }` unique, `{ topicId: 1, order: 1 }`, `{ difficulty: 1 }`, `{ platform: 1 }`

#### `progresses`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | ref → `users`, required |
| `problemId` | ObjectId | ref → `problems`, required |
| `topicId` | ObjectId | ref → `topics`, required (denormalized for fast per-topic queries) |
| `completed` | Boolean | default: `false` |
| `status` | String | enum: `solved` \| `attempted` \| `skipped` \| `pending` |
| `notes` | String | max 2000, default: `''` |
| `completedAt` | Date \| null | set on solve, cleared on unsolve |
| timestamps | — | auto |

**Indexes**: `{ userId: 1, problemId: 1 }` **unique compound**, `{ userId: 1, topicId: 1 }`, `{ userId: 1, completed: 1 }`

> **Design note**: `topicId` is denormalized from `Problem` into `Progress` to avoid a join when fetching per-topic progress. This is a deliberate read-optimization for the most frequent query pattern.

#### `streaks`

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | ref → `users`, required, **unique** |
| `currentStreak` | Number | default: 0 |
| `longestStreak` | Number | default: 0 |
| `totalSolved` | Number | default: 0 |
| `lastActivityDate` | Date \| null | UTC day granularity |
| timestamps | — | auto |

**Indexes**: `{ userId: 1 }` unique, `{ totalSolved: -1 }` (leaderboard sort), `{ currentStreak: -1 }` (leaderboard sort)

### Relationships Summary

```text
User    1 ──── * Progress    (a user has many progress records)
User    1 ──── 1 Streak      (a user has one streak record)
Topic   1 ──── * Problem     (a topic contains many problems)
Problem 1 ──── * Progress    (a problem has progress from many users)
Topic   1 ──── * Progress    (denormalized for fast per-topic lookups)
```

### Indexing Strategy

| Access Pattern | Index Used | Expected Performance |
|---|---|---|
| Login by email | `users.email` unique | O(log n), single doc |
| OAuth lookup | `users.googleId` / `githubId` sparse | O(log n), single doc |
| List topics ordered | `topics.order` | Index scan, 10 docs |
| Problems by topic | `problems.(topicId, order)` | Compound range scan |
| Filter by difficulty | `problems.difficulty` | Index scan + filter |
| User's progress on a problem | `progresses.(userId, problemId)` unique | O(log n), single doc |
| User's progress for a topic | `progresses.(userId, topicId)` | Compound prefix scan |
| Leaderboard (most solved) | `streaks.totalSolved` desc | Descending index scan, limit 50 |
| Leaderboard (longest streak) | `streaks.currentStreak` desc | Descending index scan, limit 50 |

---

## 7. API Design

### Base URL: `/api`

### Auth Endpoints

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/auth/register` | — | 5/min | Create account |
| POST | `/auth/login` | — | 10/min | Authenticate, get tokens |
| POST | `/auth/refresh` | Cookie | 30/min | Rotate token pair |
| POST | `/auth/logout` | Bearer + Cookie | — | Revoke session |
| GET | `/auth/me` | Bearer | — | Get current user |
| GET | `/auth/google` | — | — | Initiate Google OAuth |
| GET | `/auth/google/callback` | — | — | Google OAuth callback |
| GET | `/auth/github` | — | — | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | — | — | GitHub OAuth callback |

### Resource Endpoints

| Method | Path | Auth | Cache | Description |
|---|---|---|---|---|
| GET | `/topics` | — | 10 min | List all topics |
| GET | `/topics/:slug` | — | 10 min | Get topic by slug |
| POST | `/topics` | Admin | — | Create topic |
| PUT | `/topics/:id` | Admin | invalidate | Update topic |
| DELETE | `/topics/:id` | Admin | invalidate | Delete topic |
| GET | `/problems` | — | 10 min | List problems (paginated, filterable) |
| GET | `/problems/topic/:topicId` | — | 10 min | Problems by topic |
| GET | `/problems/:slug` | — | 10 min | Get problem by slug |
| POST | `/problems` | Admin | — | Create problem |
| PUT | `/problems/:id` | Admin | invalidate | Update problem |
| DELETE | `/problems/:id` | Admin | invalidate | Delete problem |

### User-Specific Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | Bearer | Get own profile |
| PATCH | `/users/profile` | Bearer | Update own profile |
| GET | `/users/:id` | Admin | Get user by ID |
| POST | `/progress/toggle` | Bearer | Toggle problem progress |
| GET | `/progress` | Bearer | Get all user progress |
| GET | `/progress/topic/:topicId` | Bearer | Get progress for a topic |
| GET | `/streaks` | Bearer | Get user's streak data |
| GET | `/leaderboard` | — | Global leaderboard (cached 5 min) |
| GET | `/health` | — | Health check |

### Response Format (Consistent)

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Topics fetched successfully"
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "statusCode": 401
  }
}
```

### Validation

All request bodies and query parameters are validated using **Zod schemas** via a `validate()` middleware. Invalid requests receive a `400` with field-level error details before reaching the controller.

---

## 8. Caching Strategy

### Cache Layers

```text
┌─────────────────────────────────────────────────────────┐
│ Layer 1: CloudFront (Edge)                              │
│ • Static assets: JS/CSS/images → TTL 1 year (hashed)    │
│ • HTML pages: short TTL or pass-through to origin       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Redis (Application)                            │
│ • Topics list        → key: "topics"       → TTL 10m    │
│ • Topic by slug      → key: "topic:{slug}" → TTL 10m    │
│ • Problems list      → key: "problems:*"   → TTL 10m    │
│ • Problems by topic  → key: "problems:topic:{id}" → 10m │
│ • Leaderboard        → key: "leaderboard:*"→ TTL 5m     │
├─────────────────────────────────────────────────────────┤
│ Layer 3: MongoDB Query Cache (WiredTiger)               │
│ • Frequently accessed documents kept in memory          │
│ • Working set should fit in RAM for M10 (2GB)           │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation

| Event | Keys Invalidated | Method |
|---|---|---|
| Topic created/updated/deleted | `topics`, `topic:{slug}` | Pattern delete |
| Problem created/updated/deleted | `problems:*`, `topic:{slug}` | Pattern delete |
| Progress toggled | No catalog cache impact | User-specific, not cached |
| Leaderboard | Auto-expires every 5 min | TTL-based |

**Why not cache user progress?** Progress is user-specific and write-heavy. Caching 50k users × 150 problems = 7.5M keys adds complexity without significant benefit. Direct MongoDB queries on indexed `(userId, problemId)` return in < 5ms.

---

## 9. Capacity Estimation

### Traffic Estimates (50k DAU)

| Metric | Estimate | Calculation |
|---|---|---|
| **DAU** | 50,000 | Given upper bound |
| **Avg. sessions/day/user** | 1.5 | Typical for study tool |
| **Avg. API calls/session** | 20 | Page loads + toggles |
| **Daily API calls** | 1.5M | 50k × 1.5 × 20 |
| **Avg. RPS** | ~17 | 1.5M / 86,400 |
| **Peak RPS** (4h window) | ~100 | 4× average during peak |
| **Peak burst RPS** | ~500 | Spike events (e.g., contest end) |

### Storage Estimates

| Collection | Docs (at 50k users) | Avg Doc Size | Total |
|---|---|---|---|
| Users | 50,000 | ~500 B | ~25 MB |
| Topics | 10 | ~300 B | < 1 KB |
| Problems | 150 | ~800 B | ~120 KB |
| Progress | 50k × 30 avg | ~200 B | ~300 MB |
| Streaks | 50,000 | ~150 B | ~7.5 MB |
| **Total** | — | — | **~335 MB** |

> Well within MongoDB Atlas M10 limits (2 GB RAM, 10 GB storage). Working set fits entirely in RAM → minimal disk I/O.

### Redis Memory

| Data | Keys | Avg Size | Total |
|---|---|---|---|
| Cached topics/problems | ~20 | ~5 KB | ~100 KB |
| Leaderboard | 2 | ~10 KB | ~20 KB |
| Token blacklist | ~5k (active JTIs) | ~100 B | ~500 KB |
| Rate limit counters | ~10k | ~50 B | ~500 KB |
| **Total** | — | — | **~1.2 MB** |

> Negligible. A `t3.micro` ElastiCache instance (512 MB) is more than sufficient.

---

## 10. Scalability & Performance

### Horizontal Scaling

```text
Current (10k DAU)                  Scaled (50k DAU)
─────────────────                  ──────────────────
ECS API: 1 task                    ECS API: 2–4 tasks
  (512 CPU, 1GB RAM)                (512 CPU, 1GB RAM each)

ECS Web: 1 task                    ECS Web: 1–2 tasks
  (256 CPU, 512MB RAM)               (256 CPU, 512MB RAM each)

Redis: t3.micro                    Redis: t3.small (or cluster mode)

MongoDB: M10                       MongoDB: M10 (upgrade to M20 at 100k+)
```

### Auto-Scaling Policy

```text
ECS Service Auto Scaling:
  • Target tracking: CPU utilization ≤ 70%
  • Min tasks: 2 (HA across AZs)
  • Max tasks: 8
  • Scale-out cooldown: 60s
  • Scale-in cooldown: 300s (conservative)
```

### Performance Optimizations Implemented

| Optimization | Impact |
|---|---|
| Compound MongoDB indexes | Eliminates collection scans; all queries use indexes |
| Redis caching (catalog data) | ~80% read reduction on topics/problems endpoints |
| Response compression (gzip) | 60-70% smaller payloads over wire |
| Helmet security headers | Prevents common attacks without perf cost |
| Next.js standalone build | Minimal Docker image (~100 MB vs ~500 MB) |
| Connection pooling | Mongoose default pool (5 connections) shared across requests |
| Selective field projection | `select: false` on password; only fetch needed fields |

### Scaling Bottlenecks & Mitigations

| Bottleneck | When | Mitigation |
|---|---|---|
| MongoDB connections | > 500 concurrent connections | Connection pooling, increase Atlas tier |
| Leaderboard query | > 100k users | Pre-computed materialized view, or dedicated analytics replica |
| Streak calculation | High write concurrency | Atomic `findOneAndUpdate`, idempotent by UTC day |
| Redis single-node | > 1 GB cache | Switch to Redis Cluster or ElastiCache cluster mode |

---

## 11. Security Considerations

### Authentication Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt with cost factor 12 |
| JWT signing | HS256 with separate secrets for access/refresh |
| Token revocation | Redis blacklist (access), family rotation (refresh) |
| Brute force protection | Rate limiting: 10 login attempts/min per IP |
| OAuth state validation | Passport.js handles CSRF state parameter |

### API Security

| Measure | Implementation |
|---|---|
| Input validation | Zod schemas on all endpoints (body, query, params) |
| SQL/NoSQL injection | Mongoose parameterized queries, no raw `$where` |
| XSS prevention | Helmet CSP headers, JSON-only API responses |
| CORS | Whitelist `CLIENT_URL` only, credentials mode |
| Rate limiting | Redis sliding-window, global + per-route limits |
| HTTPS | Enforced via ALB + CloudFront SSL termination |

### Data Protection

| Measure | Implementation |
|---|---|
| Secrets management | Environment variables, never in code/git |
| Cookie security | `httpOnly`, `secure`, `sameSite: strict` |
| Password field | `select: false` — never returned in API responses |
| User enumeration | Generic error messages on login failure |
| Admin routes | `authorize('admin')` middleware, role-checked |

---

## 12. Monitoring & Observability

### Recommended Stack (Production)

```text
┌──────────────────────────────────────────────┐
│                Observability                 │
├──────────────┬──────────────┬────────────────┤
│   Metrics    │   Logging    │   Alerting     │
│──────────────│──────────────│────────────────│
│ CloudWatch   │ CloudWatch   │ CloudWatch     │
│ • CPU/Memory │   Logs       │   Alarms       │
│ • Request    │ • Structured │ • CPU > 80%    │
│   count      │   JSON logs  │ • 5xx > 1%     │
│ • ALB        │ • Request ID │ • Latency p95  │
│   latency    │   tracing    │   > 500ms      │
│ • Error rate │ • Error      │ • Container    │
│              │   stack trace│   restarts > 2 │
└──────────────┴──────────────┴────────────────┘
```

### Health Check Endpoint

```
GET /api/health → { status: "ok", uptime: 12345, timestamp: "..." }
```

Used by ALB target group health checks (interval: 30s, threshold: 3 consecutive failures → drain task).

### Key Metrics to Track

| Metric | Source | Alert Threshold |
|---|---|---|
| API p95 latency | ALB target response time | > 500ms |
| 5xx error rate | ALB HTTP 5xx count | > 1% of requests |
| CPU utilization | ECS task metrics | > 80% sustained |
| MongoDB connections | Atlas monitoring | > 80% pool utilization |
| Redis memory | ElastiCache metrics | > 70% used |
| Cache hit ratio | Application logs | < 50% (investigate) |

---

## 13. Failure Modes & Resilience

| Failure | Impact | Mitigation |
|---|---|---|
| **API task crash** | Reduced capacity | ECS restarts task automatically; ALB routes to healthy tasks; min 2 tasks across AZs |
| **Redis down** | Cache miss, rate limits disabled | API falls back to direct MongoDB queries; rate limiting degrades gracefully (allows all) |
| **MongoDB primary failover** | ~10-30s write unavailability | Atlas auto-elects new primary; app retries with exponential backoff (Mongoose handles) |
| **CloudFront origin failure** | Cannot serve new content | Stale-while-revalidate; ALB health checks remove bad origins |
| **Token signing secret leak** | All JWTs compromised | Rotate secrets → all existing tokens invalidated → users must re-login |
| **DDoS on login** | Auth service overwhelmed | Rate limiting (5 reg/min, 10 login/min per IP); CloudFront WAF rules |

### Zero-Downtime Deployments

```text
ECS Rolling Update Strategy:
  • minimumHealthyPercent: 100%  (never fewer tasks than desired)
  • maximumPercent: 200%         (spin up new before draining old)
  • Health check grace period: 60s
  • Deregistration delay: 30s

Flow:
  1. New task definition registered
  2. ECS launches new tasks (blue)
  3. ALB health check passes
  4. Old tasks (green) drain connections
  5. Old tasks stopped
```

---

## 14. Trade-offs & Design Decisions

### MongoDB vs PostgreSQL

| Factor | MongoDB (chosen) | PostgreSQL |
|---|---|---|
| Schema flexibility | Documents evolve without migrations | Requires ALTER TABLE |
| Joins | Manual population / denormalization | Native JOINs |
| Transactions | Supported with replica set | Native ACID |
| Scaling reads | Built-in replica reads | Read replicas (more setup) |
| Fit for this app | Hierarchical data (topic → problems → resources) maps naturally to documents | Better if heavy relational queries were needed |

**Decision**: MongoDB — the data model is naturally hierarchical, schema changes are frequent during early development, and the read-heavy workload benefits from document locality. The lack of cross-collection joins is mitigated by strategic denormalization (`topicId` in Progress).

### JWT vs Server Sessions

| Factor | JWT (chosen) | Server Sessions |
|---|---|---|
| Scalability | Stateless; any API task can validate | Requires shared session store |
| Revocation | Requires blacklist (Redis) | Native: delete session |
| Payload | Carries claims (no DB lookup for authz) | Requires DB lookup per request |
| Size | ~800 bytes (header overhead) | ~32 bytes (session ID) |

**Decision**: JWT — stateless validation is critical for horizontally scaled ECS tasks. The revocation gap is closed with Redis JTI blacklist (access, 15m TTL) and token family rotation (refresh). Short access token lifetime (15m) limits exposure window.

### ECS Fargate vs Lambda

| Factor | ECS Fargate (chosen) | Lambda |
|---|---|---|
| Cold start | None | 200–800ms (Node.js) |
| Connection pooling | Persistent (Mongoose pool) | Per-invocation (or RDS Proxy) |
| Cost at 50k DAU | Predictable (~$50–80/mo) | Variable, can spike |
| Operational control | Full (Docker, health checks) | Limited |

**Decision**: ECS Fargate — sustained traffic pattern (not spiky), persistent DB connections, and predictable costs. Lambda would be better for event-driven or low-traffic workloads where cost-to-zero matters.

### Denormalized `topicId` in Progress

**Trade-off**: Storing `topicId` on each Progress document duplicates data from the Problem document, violating normalization.

**Justification**: The "get all progress for a topic" query (`GET /progress/topic/:topicId`) is one of the most frequent queries. Without denormalization, this requires either:
1. A `$lookup` (join) from Progress → Problem → filter by topicId — expensive
2. Two queries: fetch problemIds for topic, then fetch progress — N+1 risk

With denormalization, it's a single indexed query: `Progress.find({ userId, topicId })`. The write overhead of maintaining `topicId` is negligible since problems rarely change topics.

---

## 15. Future Roadmap

| Phase | Feature | Complexity | Value |
|---|---|---|---|
| **v1.1** | Search & filter problems (by name, difficulty, status) | Low | High |
| **v1.1** | Topic-level progress bars (e.g., "8/15 solved") | Low | High |
| **v1.2** | Personal notes per problem (backend exists, wire to UI) | Low | Medium |
| **v1.2** | Forgot password flow (email token-based reset) | Medium | High |
| **v2.0** | Community rooms (discussion, peer review) | High | High |
| **v2.0** | Timed mock tests with scoring | High | High |
| **v2.1** | WebSocket-based live leaderboard updates | Medium | Medium |
| **v2.1** | Push notifications (streak reminders) | Medium | Medium |
| **v3.0** | AI-powered problem recommendations based on weak areas | High | High |
| **v3.0** | Multi-language code execution sandbox | Very High | High |

### Scaling Beyond 50k DAU

| Threshold | Action |
|---|---|
| **100k DAU** | Upgrade MongoDB Atlas to M20; add Redis cluster mode; add third AZ |
| **250k DAU** | Introduce read replicas for analytics; separate leaderboard service |
| **500k+ DAU** | Event-driven architecture (SQS/SNS for progress events); CQRS for leaderboard; consider microservices split |
