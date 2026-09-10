# syntax=docker/dockerfile:1.7
FROM node:26-alpine AS base
RUN npm install -g pnpm@11.25.0

# Build stage
FROM base AS builder
WORKDIR /app

# Source is copied before the install: the dependency LAYER no longer carries
# the caching, the build-cache-mounted store does. That store outlives every
# layer, so a source edit costs a re-link rather than a re-download.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

COPY packages ./packages
COPY apps/worker ./apps/worker

# `pnpm fetch` has no filter: it primes the store from the ENTIRE monorepo
# lockfile — React Native and Expo included — to build one app that needs a
# fraction of it. A filtered install fetches only this app's closure, and the
# store lives in a build cache shared by every image and every build, so a
# lockfile change re-resolves just what moved.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --filter @pkg/worker... --store-dir /pnpm-store
RUN pnpm --filter @pkg/worker... build

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
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm --filter @pkg/worker deploy --prod /prod \
      --store-dir /pnpm-store \
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

# `pnpm deploy` flattens the package to the root of this image — there is no
# apps/worker subtree to change into any more.
COPY --from=builder /prod ./

CMD ["node", "dist/main.js"]
