# Valmonto Boilerplate (Valmatic)

Full-stack SaaS starter kit with multi-tenant auth, RBAC, organizations, and background jobs. Solid foundation — add CI/CD and monitoring for production.

## Quick Start

```bash
# 1. Initialize your project
pnpm init:project        # Set project name, details
```

```bash
# 2. Install & build
pnpm install && pnpm build
```

```bash
# 3. Start infrastructure
docker compose -f compose.dev.yml up -d
```

```bash
# 4. Configure environment
## Linux
export DATABASE_URL=postgresql://vboilerplate:vboilerplate@127.0.0.1:5432/vboilerplate
export IAM_REDIS_HOST=127.0.0.1
export IAM_REDIS_PORT=6379
export IAM_REDIS_PASSWORD=vboilerplate
export IAM_JWT_SECRET=$(openssl rand -hex 32)
export IAM_COOKIE_SECRET=$(openssl rand -hex 32)
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export REDIS_PASSWORD=vboilerplate
```

```ps1
## or if Windows (Powershell)
$env:DATABASE_URL = "postgresql://vboilerplate:vboilerplate@127.0.0.1:5432/vboilerplate"
$env:IAM_REDIS_HOST = "127.0.0.1"
$env:IAM_REDIS_PORT = "6379"
$env:IAM_REDIS_PASSWORD = "vboilerplate"
$env:IAM_JWT_SECRET = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$env:IAM_COOKIE_SECRET = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$env:REDIS_HOST = "127.0.0.1"
$env:REDIS_PORT = "6379"
$env:REDIS_PASSWORD = "vboilerplate"
```

```bash
# 5. Run migrations & start
pnpm db:migrate
pnpm dev
```

**API:** http://localhost:3000 | **Web:** http://localhost:5173

---

## What's Included

| Feature             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| **Multi-Tenancy**   | Users belong to multiple orgs with different roles           |
| **Authentication**  | Login, register, logout, password change, session management |
| **RBAC**            | OWNER / ADMIN / MEMBER roles per organization                |
| **Background Jobs** | Redis-backed queues with BullMQ                              |
| **Notifications**   | In-app notification system                                   |
| **E2E Tests**       | Playwright tests for auth, RBAC, tenant isolation            |

---

## Architecture

```
valmonto-boilerplate/
├── apps/
│   ├── api/        # NestJS REST API (Fastify, Drizzle)
│   ├── web/        # React SPA (Vite, Tailwind, shadcn/ui)
│   ├── worker/     # Background job processor (BullMQ)
│   └── e2e/        # Playwright tests
│
└── packages/
    ├── contracts/  # Shared Zod schemas & types
    ├── database/   # Drizzle ORM schemas & migrations
    ├── server/     # Shared NestJS modules (IAM, guards, queues)
    ├── locales/    # i18n translation keys
    └── utils/      # Shared utilities
```

---

## Tech Stack

| Layer           | Technologies                                            |
| --------------- | ------------------------------------------------------- |
| **Frontend**    | React 19, Vite, Tailwind CSS 4, shadcn/ui, SWR, Zustand |
| **Backend**     | NestJS, Fastify, Drizzle ORM, Zod                       |
| **Database**    | PostgreSQL                                              |
| **Cache/Queue** | Redis, BullMQ                                           |
| **Testing**     | Vitest, Playwright                                      |
| **Tooling**     | pnpm workspaces, TypeScript, ESLint                     |

---

## Commands

```bash
# Development
pnpm dev                 # Start all apps (API, Web, Worker)
pnpm dev:api             # Start single app if needed

# Database
pnpm db:generate         # Generate migrations from schema changes
pnpm db:migrate          # Apply migrations
pnpm db:studio           # Open Drizzle Studio

# Testing
pnpm test                # Unit tests
pnpm e2e                 # E2E tests (headless)
pnpm e2e:ui              # E2E with Playwright UI

# Quality
pnpm build               # Build all packages
pnpm typecheck           # Type check
pnpm lint                # Lint (use lint:fix to auto-fix)
pnpm format              # Format with Prettier

# Utilities
pnpm init:project        # Initialize project name/details
pnpm i18n:extract        # Extract translation strings
pnpm clear               # Remove all node_modules

# License Compliance
pnpm licenses:check      # Check dependencies for disallowed licenses
pnpm licenses:generate   # Generate license report
pnpm licenses:why <pkg>  # Show why a package is included
```

---

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes:**

| Apps | Packages | Other |
| ---- | -------- | ----- |
| `api`, `web`, `worker`, `e2e` | `contracts`, `database`, `server`, `locales`, `utils`, `eslint-config`, `tsconfig` | `deps`, `ci`, `release`, `config` |

**Rules:**
- Subject must be lowercase, no period at end
- Scope is recommended but not required

**Examples:**
```bash
feat(api): add user invitation endpoint
fix(web): resolve login redirect loop
chore(deps): update dependencies
refactor(database): simplify migration scripts
```

---

## Releasing

This project uses [release-it](https://github.com/release-it/release-it) with [git-cliff](https://github.com/orhun/git-cliff) for changelog generation.

```bash
pnpm release:dry         # Preview what will happen (no changes)
pnpm release             # Create a release
```

**What happens during a release:**
1. Prompts for version bump (patch/minor/major)
2. Updates `package.json` version
3. Generates `CHANGELOG.md` from conventional commits
4. Creates commit: `chore(release): v<version>`
5. Tags: `v<version>`

**Requirements:**
- Must be on `main` branch
- Working directory must be clean

---

## Documentation

Each app has detailed documentation:

- [`apps/api/README.md`](apps/api/README.md) — API endpoints, patterns, adding modules
- [`apps/web/README.md`](apps/web/README.md) — Components, data fetching, adding pages
- [`apps/worker/README.md`](apps/worker/README.md) — Queue processing, adding jobs
- [`apps/e2e/README.md`](apps/e2e/README.md) — Writing and running E2E tests

---

## License

MIT
