FROM node:24.22.1-alpine AS base
RUN npm install -g pnpm@11.25.0

# Build stage
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
# Vite inlines env at BUILD time; the e2e suite exercises open signup.
ENV VITE_PUBLIC_REGISTRATION_ENABLED=true
RUN pnpm --filter @pkg/web build

# Production stage - serve with Caddy, like the deployed web image. HTTPS
# with Caddy's internal CA (secure cookies need it); /api goes to the api
# container. See apps/e2e/Caddyfile.
FROM caddy:2-alpine AS runner

COPY --from=builder /app/apps/web/dist /srv
COPY apps/e2e/Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000
