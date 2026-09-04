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
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter @pkg/web... build

# Production stage - serve with a simple static server
FROM node:26-alpine AS runner
RUN npm install -g serve@14

WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
