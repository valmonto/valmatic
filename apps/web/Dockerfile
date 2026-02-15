FROM node:24-alpine AS base
RUN npm install -g pnpm@10

# Build stage
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pkg/web build

# Production stage - serve with a simple static server
FROM node:24-alpine AS runner
RUN npm install -g serve@14

WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
