FROM node:24-alpine AS base
RUN npm install -g pnpm@10

# Build stage
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pkg/api build
RUN pnpm --filter @pkg/database build

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

RUN pnpm install --frozen-lockfile --prod

# Copy entrypoint script and make executable
COPY --from=builder /app/apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
