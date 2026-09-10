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
COPY apps/web ./apps/web

# `pnpm fetch` has no filter: it primes the store from the ENTIRE monorepo
# lockfile — React Native and Expo included — to build one app that needs a
# fraction of it. A filtered install fetches only this app's closure, and the
# store lives in a build cache shared by every image and every build, so a
# lockfile change re-resolves just what moved.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --filter @pkg/web... --store-dir /pnpm-store
RUN pnpm --filter @pkg/web... build

# Production stage - serve with a simple static server
FROM node:26-alpine AS runner
RUN npm install -g serve@14

WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
