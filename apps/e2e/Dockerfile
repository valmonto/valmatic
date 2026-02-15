FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy all packages (needed for workspace dependencies)
COPY packages ./packages
COPY apps/e2e ./apps/e2e

# Install pnpm
RUN npm install -g pnpm@10

# Install dependencies
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/e2e

# Run tests
CMD ["pnpm", "test"]
