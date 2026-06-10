# Valmonto Boilerplate (Valmatic)

Full-stack SaaS starter kit with multi-tenant auth, RBAC, organizations, and background jobs. Solid foundation — add CI/CD and monitoring for production.

## Quick Start

```bash
# 0. Clone the repo:
git clone https://github.com/valmonto/valmatic.git my-valmatic-project
```

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
docker compose -f compose.dev.yml up
```

```bash
# 4. Configure environment
## Linux
export DATABASE_URL=postgresql://vboilerplate:vboilerplate@127.0.0.1:5432/vboilerplate
export DATABASE_PASSWORD=secretpass
export IAM_REDIS_HOST=127.0.0.1
export IAM_REDIS_PORT=6379
export IAM_REDIS_PASSWORD=vboilerplate
export IAM_JWT_SECRET=$(openssl rand -hex 32)
export IAM_COOKIE_SECRET=$(openssl rand -hex 32)
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export REDIS_PASSWORD=vboilerplate
export SEED_ON_STARTUP=true
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
$env:SEED_ON_STARTUP = "true"
```

```bash
# 5. Run migrations, seed an initial login & start
pnpm db:migrate
pnpm db:seed             # creates the initial owner + demo users (see Database Seeding)
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
pnpm db:seed             # Seed the database (strategy picked from NODE_ENV)
pnpm db:seed:dev         # Force the development seeder
pnpm db:seed:prod        # Force the production seeder

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
pnpm clear               # Remove all node_modules

# License Compliance
pnpm licenses:check      # Check dependencies for disallowed licenses
pnpm licenses:generate   # Generate license report
pnpm licenses:why <pkg>  # Show why a package is included
```

---

## Database Seeding

The API ships with an idempotent seeder (`apps/api/src/seed`) that bootstraps the
data needed to log in. It picks a strategy automatically from `NODE_ENV` and can
also run automatically on startup in development.

### Strategies

| Strategy        | When it runs                    | What it creates                                                                         |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| **production**  | `NODE_ENV=production`           | One owner user (`OWNER` + system `ADMIN`) and one organization — initial login only     |
| **development** | any other `NODE_ENV` (dev/test) | The production seed **plus** demo users loaded from `apps/api/src/seed/data/users.json` |

Both strategies are **idempotent** — re-running converges to the same state and
never overwrites a password that already exists.

### Running it

```bash
pnpm db:migrate          # make sure the schema is up to date first
pnpm db:seed             # strategy from NODE_ENV (development locally)
pnpm db:seed:dev         # force the development seeder
pnpm db:seed:prod        # force the production seeder
```

> The seed scripts require a built API (`pnpm build`) and load the root `.env`
> automatically when present (no-op in containers, where env is injected).

### Auto-seed on startup (dev convenience)

Set `SEED_ON_STARTUP=true` and the API runs the seeder as it boots — handy for a
fresh dev or staging container so the database is immediately usable. It is **off
by default**; production should seed explicitly via `pnpm db:seed:prod`.

### Configuration

All initial-login values come from the environment. They are **optional in
development** (safe defaults are applied) and **required in production**
(validated at startup).

| Variable                | Default (dev)        | Description                                  |
| ----------------------- | -------------------- | -------------------------------------------- |
| `SEED_INITIAL_EMAIL`    | `owner@valmonto.com` | Email of the initial owner user              |
| `SEED_INITIAL_PASSWORD` | `ChangeMe123!`       | Plaintext password, hashed on first create   |
| `SEED_INITIAL_NAME`     | `Initial Owner`      | Display name of the initial owner            |
| `SEED_INITIAL_ORG_NAME` | `Valmonto`           | Name of the initial organization             |
| `SEED_ON_STARTUP`       | `false`              | Auto-run the seeder when the API boots       |
| `SEED_STRATEGY`         | _(unset)_            | Force `production` or `development` strategy |

### Development fixtures

Edit `apps/api/src/seed/data/users.json` to change the demo dataset — no code
changes required. Each entry is validated against the contract schemas:

```json
{
  "email": "admin@valmonto.com",
  "name": "Dev Admin",
  "systemRole": "ADMIN",
  "orgRole": "ADMIN"
}
```

`password` is optional per entry and falls back to `SEED_INITIAL_PASSWORD`.

---

## Logging

Apps log via [pino](https://getpino.io) (`nestjs-pino`), configured centrally in
`@pkg/server`. Inject a context-bound logger with `@InjectLogger()`:

```ts
constructor(@InjectLogger() private readonly logger: PinoLogger) {}
```

### Quieting NestJS bootstrap logs

By default, NestJS's framework startup logs (module wiring, route mappings, the
`path-to-regexp` legacy warning — `InstanceLoader`, `RoutesResolver`,
`RouterExplorer`, …) are **hidden** so boot output stays readable. Your own
application logs are never affected, and errors always show.

Set `LOG_FRAMEWORK=true` to bring them back when debugging routing or DI:

```bash
# .env
LOG_FRAMEWORK=false   # default — quiet startup
LOG_FRAMEWORK=true    # show full NestJS bootstrap output

# or per-run
LOG_FRAMEWORK=true pnpm dev:api
```

Applies to the API, worker, and the seed CLI.

---

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes:**

| Apps                          | Packages                                                                           | Other                             |
| ----------------------------- | ---------------------------------------------------------------------------------- | --------------------------------- |
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
