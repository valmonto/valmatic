FROM node:26-alpine AS base
RUN npm install -g pnpm@10

# Build stage
FROM base AS builder
WORKDIR /app

# Dependencies resolve from the lockfile ALONE, before any source is copied —
# this layer survives source edits, so a rebuild re-fetches only when the
# lockfile (or root manifest) actually changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter @pkg/api... build

# Production stage
FROM node:26-alpine AS runner
WORKDIR /app

# Build identity, served by /health. Passed by the deploy workflow
# (`GIT_SHA=$(git rev-parse HEAD)` via compose build args) — never hand-set.
# Left empty (local builds) the app reports `sha: null`, which is the truth.
ARG GIT_SHA=
ARG BUILT_AT=
ENV GIT_SHA=$GIT_SHA \
    BUILT_AT=$BUILT_AT

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Copy entrypoint script and make executable
COPY --from=builder /app/apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
