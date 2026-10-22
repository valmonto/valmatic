# syntax=docker/dockerfile:1.7
FROM node:26.12.1-alpine AS base
RUN npm install -g pnpm@11.25.0
# Before every `pnpm run`/`exec`, pnpm checks that node_modules still matches
# the manifests by comparing file times. In this image the install runs on
# manifests stamped 2000-01-01 (see the manifests stage) and the source lands
# later with its real times, so the check would always see a "changed"
# manifest, start a full `pnpm install`, and then refuse to purge the filtered
# node_modules without a TTY (ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY).
# The install step in the builder is the source of truth here; skip the check.
# pnpm 11 reads pnpm_config_*, not npm_config_*.
ENV pnpm_config_verify_deps_before_run=false

# --- Dependency manifests, nothing else ---
# What decides an install is the lockfile, the workspace config and every
# package.json, never a line of code. This stage sees the whole context (a
# copy and a find, seconds), but its OUTPUT is only those files, and BuildKit
# keys a `COPY --from` on what it copies. A code change re-runs this stage and
# still hits the cache for the install below.
# `bin/` folders come along because pnpm links a workspace package's bin at
# install time (packages/database's db-migrate). Timestamps are pinned because
# the `COPY --from` key includes them and this stage re-runs on every change;
# fresh times would defeat the point.
FROM base AS manifests
WORKDIR /src
COPY . .
RUN mkdir /out \
 && cp package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc /out/ \
 && find apps packages -mindepth 2 -maxdepth 2 \( -name package.json -o -name bin \) \
    | tar -cf - -T - | tar -xf - -C /out \
 && find /out -exec touch -h -d '2000-01-01 00:00:00' {} +

# Build stage
FROM base AS builder
WORKDIR /app

# Dependencies first, source second: the install is keyed on the manifests
# alone, so a code change reuses the installed layer whole. The install used
# to run after the source was copied, on the theory that the cache-mounted
# store made a re-install cheap. It was not: nothing was downloaded, yet
# linking into node_modules cost a descendant 1m21s on the API and 3m45s per
# web build, on every deploy.
COPY --from=manifests /out ./

# `pnpm fetch` has no filter: it primes the store from the ENTIRE monorepo
# lockfile — React Native and Expo included — to build one app that needs a
# fraction of it. A filtered install fetches only this app's closure, and the
# store lives in a build cache shared by every image and every build, so a
# lockfile change re-resolves just what moved.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --filter @pkg/web... --store-dir /pnpm-store

COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @pkg/web... build

# Production stage - serve with a simple static server
FROM node:26.12.1-alpine AS runner
RUN npm install -g serve@14

WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

# Not root: `serve` only reads dist/, and 3000 is above the ports only root
# may bind. The files stay root-owned, so the server cannot rewrite the site
# it serves. See apps/api/Dockerfile.
USER node

CMD ["serve", "-s", "dist", "-l", "3000"]
