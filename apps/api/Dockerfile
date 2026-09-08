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
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter @pkg/api... build

# `pnpm deploy` emits ONE package plus its production dependencies, flattened
# and self-contained. Copying the builder's node_modules instead ships the whole
# monorepo's dependency graph — React Native, Expo, Hermes, the linter binaries —
# into an image whose entrypoint is `node dist/main.js`. That was 2.1 GB crossing
# a network on every deploy.
# inject-workspace-packages is set HERE rather than in pnpm-workspace.yaml:
# repo-wide it would copy workspace packages instead of symlinking them, which
# breaks watch-mode development. `deploy` needs it to resolve a workspace
# package's own dependencies (@pkg/server declares @nestjs/jwt as both a
# dependency and a peer; --legacy resolves neither).
RUN pnpm --filter @pkg/api deploy --prod /prod \
      --config.inject-workspace-packages=true

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

COPY --from=builder /prod ./

# Copy entrypoint script and make executable
COPY --from=builder /app/apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
