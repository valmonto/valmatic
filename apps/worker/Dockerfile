FROM node:26-alpine AS base
RUN npm install -g pnpm@11.25.0

# Build stage
FROM base AS builder
WORKDIR /app

# Dependencies resolve from the lockfile ALONE, before any source is copied —
# this layer survives source edits, so a rebuild re-fetches only when the
# lockfile (or root manifest) actually changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY packages ./packages
COPY apps/worker ./apps/worker

RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter @pkg/worker... build

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
COPY --from=builder /app/apps/worker ./apps/worker

WORKDIR /app/apps/worker

CMD ["node", "dist/main.js"]
