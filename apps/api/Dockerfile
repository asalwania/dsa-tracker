# Stage 1 — Builder
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @dsa-tracker/api

COPY apps/api/ apps/api/

RUN pnpm --filter @dsa-tracker/api build

# Stage 2 — Production
FROM node:20-alpine AS production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 5000

USER appuser

CMD ["node", "dist/server.js"]
