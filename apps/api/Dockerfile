FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @dsa-tracker/api

COPY apps/api/ apps/api/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app/apps/api

ENV NODE_ENV=production

EXPOSE 5000

USER appuser

CMD ["pnpm", "exec", "tsx", "src/server.ts"]
