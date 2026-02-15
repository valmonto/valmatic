# Packages

Shared packages used across the vboilerplate monorepo.

## Overview

| Package              | Description                        | Used By      |
| -------------------- | ---------------------------------- | ------------ |
| `@pkg/contracts`     | Zod schemas and TypeScript types   | All apps     |
| `@pkg/database`      | Drizzle ORM schema and client      | API, Worker  |
| `@pkg/server`        | NestJS modules, guards, decorators | API, Worker  |
| `@pkg/locales`       | i18n translations and keys         | Web, API     |
| `@pkg/utils`         | Shared utility functions           | All apps     |
| `@pkg/eslint-config` | ESLint configurations              | All packages |
| `@pkg/tsconfig`      | TypeScript configurations          | All packages |

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                         APPS                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │   web   │    │   api   │    │ worker  │    │   e2e   │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └─────────┘  │
│       │              │              │                       │
└───────┼──────────────┼──────────────┼───────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                       PACKAGES                              │
│                                                             │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│  │ contracts │◀──│  server   │◀──│ database  │             │
│  └───────────┘   └─────┬─────┘   └───────────┘             │
│        ▲               │                                    │
│        │               ▼                                    │
│  ┌───────────┐   ┌───────────┐                             │
│  │  locales  │◀──│   utils   │                             │
│  └───────────┘   └───────────┘                             │
│                                                             │
│  ┌───────────────┐   ┌───────────────┐                     │
│  │ eslint-config │   │   tsconfig    │  (tooling)          │
│  └───────────────┘   └───────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## `@pkg/contracts`

Shared Zod schemas and TypeScript types for API contracts.

### Structure

```
src/
├── index.ts
└── schemas/
    ├── auth.schema.ts        # Login, register, logout
    ├── user.schema.ts        # User CRUD
    ├── organization.schema.ts # Org management
    ├── notification.schema.ts # Notifications
    ├── jobs.schema.ts        # Background jobs
    ├── iam.schema.ts         # IAM types
    └── pagination.schema.ts  # Pagination helpers
```

### Usage

```typescript
import {
  LoginRequestSchema,
  LoginRequest,
  LoginResponse,
  CreateUserRequestSchema,
  CreateUserRequest,
} from '@pkg/contracts';

// Validate request
const dto = LoginRequestSchema.parse(body);

// Type-safe response
const response: LoginResponse = { user, token };
```

### Adding a Schema

```typescript
// src/schemas/products.schema.ts
import { z } from 'zod';

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export type CreateProductResponse = {
  id: string;
  name: string;
  price: number;
};
```

---

## `@pkg/database`

Drizzle ORM schema, client, and migrations.

### Structure

```
src/
├── index.ts              # Main exports
├── client.ts             # Database client factory
├── migrate.ts            # Migration runner
├── cli/
│   └── migrate.ts        # CLI migration command
├── nestjs/
│   └── database.module.ts # NestJS module
└── schema/
    ├── helpers.ts        # UUID, timestamps
    ├── user.ts           # User table
    ├── organization.ts   # Organization table
    ├── organization-user.ts # Org membership
    ├── notification.ts   # Notifications
    └── relations.ts      # Table relations
```

### Usage

```typescript
import {
  DatabaseModule,
  DATABASE_CLIENT,
  DatabaseClient,
  user,
  organization,
  eq,
} from '@pkg/database';

// In NestJS
@Module({
  imports: [
    DatabaseModule.forRootAsync({
      useFactory: (config) => ({
        url: config.get('DATABASE_URL'),
      }),
    }),
  ],
})
// In repository
@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_CLIENT) private db: DatabaseClient) {}

  async findById(id: string) {
    return this.db.db.select().from(user).where(eq(user.id, id));
  }
}
```

### Commands

```bash
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema (dev only)
pnpm db:studio     # Open Drizzle Studio
```

### Adding a Table

```typescript
// src/schema/products.ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { generateId, timestamps } from './helpers';

export const product = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  ...timestamps,
});

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
```

---

## `@pkg/server`

Shared NestJS modules, guards, decorators, and services.

### Structure

```
src/
├── index.ts
├── common/
│   ├── decorators/
│   │   └── zod-request.ts    # @ZodRequest()
│   └── filters/
│       └── global-exception.filter.ts
├── config/
│   ├── cookies.ts            # Cookie options
│   └── security.ts           # Security constants
└── modules/
    ├── iam/                  # Identity & Access Management
    │   ├── iam.module.ts
    │   ├── iam.service.ts
    │   └── auth-providers/
    │       ├── decorators/
    │       │   ├── active-user.decorator.ts  # @ActiveUser()
    │       │   ├── public-route.decorator.ts # @PublicRoute()
    │       │   └── roles.decorator.ts        # @Roles()
    │       └── local/
    │           └── local-auth.provider.ts
    ├── queues/               # BullMQ queues
    │   ├── queues.module.ts
    │   └── example/
    │       ├── example.producer.ts
    │       └── example.types.ts
    ├── events/               # Event emitter
    │   └── events.module.ts
    ├── health/               # Health checks
    │   └── health.module.ts
    └── redis/                # Redis module
        └── redis.module.ts
```

### Exports

```typescript
// Decorators
import { ZodRequest, ActiveUser, PublicRoute, Roles, Role } from '@pkg/server';

// Modules
import {
  IamModule,
  IamService,
  QueuesModule,
  ExampleProducer,
  EventsModule,
  HealthModule,
  RedisModule,
} from '@pkg/server';

// Filters
import { GlobalExceptionFilter } from '@pkg/server';

// Config
import { COOKIE_OPTIONS, COOKIE_TTL } from '@pkg/server';

// Types
import { ExampleJobPayload, ExampleJobResult, AppEvents } from '@pkg/server';
```

### Adding a Queue

```typescript
// src/modules/queues/my-queue/my-queue.constants.ts
export const MY_QUEUE = {
  name: 'my-queue',
  workerOptions: { concurrency: 5 },
};

// src/modules/queues/my-queue/my-queue.types.ts
export type MyJobPayload = { userId: string; data: unknown };
export type MyJobResult = { success: boolean };

// src/modules/queues/my-queue/my-queue.producer.ts
@Injectable()
export class MyQueueProducer {
  constructor(@InjectQueue(MY_QUEUE.name) private queue: Queue) {}

  async enqueue(payload: MyJobPayload) {
    return this.queue.add('process', payload);
  }
}
```

---

## `@pkg/locales`

i18n translations, keys, and configuration.

### Structure

```
src/
├── index.ts
├── keys/
│   ├── index.ts          # Combined keys export
│   ├── auth.ts           # auth.* keys
│   ├── common.ts         # common.* keys
│   ├── users.ts          # users.* keys
│   ├── orgs.ts           # orgs.* keys
│   ├── jobs.ts           # jobs.* keys
│   ├── notifications.ts  # notifications.* keys
│   └── validation.ts     # validation.* keys
└── translations/
    ├── en.json           # English
    └── es.json           # Spanish
```

### Usage

```typescript
import { k, translations, i18nConfig, supportedLanguages } from '@pkg/locales';

// In React
const { t } = useTranslation();
t(k.auth.login); // "Sign In"
t(k.common.save); // "Save"
t(k.validation.required); // "This field is required"

// In NestJS
this.i18n.t(k.auth.errors.invalidCredentials);
```

### Adding Translations

1. **Add key:**

   ```typescript
   // src/keys/products.ts
   export const products = {
     title: 'products.title',
     create: 'products.create',
     errors: {
       notFound: 'products.errors.notFound',
     },
   } as const;
   ```

2. **Add translations:**
   ```json
   // translations/en.json
   {
     "products": {
       "title": "Products",
       "create": "Create Product",
       "errors": {
         "notFound": "Product not found"
       }
     }
   }
   ```

---

## `@pkg/utils`

Shared utility functions.

### Exports

```typescript
import { tryCatch } from '@pkg/utils';

// Async error handling without try/catch
const { d: data, e: error } = await tryCatch(fetchUser(id));

if (e) {
  console.error('Failed:', e.message);
  return;
}

console.log('User:', d);
```

### Adding Utilities

```typescript
// src/format.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// src/index.ts
export { tryCatch } from './try-catch';
export { formatCurrency } from './format';
```

---

## `@pkg/eslint-config`

Shared ESLint configurations.

### Configurations

| Export                      | Description           |
| --------------------------- | --------------------- |
| `@pkg/eslint-config/base`   | Base TypeScript rules |
| `@pkg/eslint-config/react`  | React + hooks rules   |
| `@pkg/eslint-config/nestjs` | NestJS rules          |

### Usage

```javascript
// eslint.config.js
import baseConfig from '@pkg/eslint-config/base';

export default [...baseConfig];

// For React apps
import reactConfig from '@pkg/eslint-config/react';
export default [...reactConfig];

// For NestJS apps
import nestjsConfig from '@pkg/eslint-config/nestjs';
export default [...nestjsConfig];
```

---

## `@pkg/tsconfig`

Shared TypeScript configurations.

### Configurations

| File           | Description          |
| -------------- | -------------------- |
| `base.json`    | Base strict config   |
| `library.json` | For library packages |
| `react.json`   | For React apps       |
| `nestjs.json`  | For NestJS apps      |

### Usage

```json
// tsconfig.json
{
  "extends": "@pkg/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## Development

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @pkg/contracts build

# Watch mode (development)
pnpm --filter @pkg/contracts dev
```

### Testing

```bash
# Run tests in packages with tests
pnpm --filter @pkg/server test
pnpm --filter @pkg/utils test
```

### Adding a New Package

1. Create directory: `packages/my-package/`

2. Create `package.json`:

   ```json
   {
     "name": "@pkg/my-package",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "exports": {
       ".": {
         "types": "./src/index.ts",
         "import": "./dist/index.mjs",
         "require": "./dist/index.cjs"
       }
     },
     "scripts": {
       "build": "tsdown",
       "dev": "tsdown --watch"
     },
     "devDependencies": {
       "@pkg/tsconfig": "workspace:*",
       "@pkg/eslint-config": "workspace:*",
       "tsdown": "catalog:",
       "typescript": "catalog:"
     }
   }
   ```

3. Create `tsconfig.json`:

   ```json
   {
     "extends": "@pkg/tsconfig/library.json",
     "include": ["src"]
   }
   ```

4. Create `src/index.ts` with exports

5. Run `pnpm install` from root
