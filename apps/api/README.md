# API App (`@pkg/api`)

REST API backend for the \vboilerplate platform. Handles authentication, user management, and job orchestration.

## Tech Stack

| Category   | Technology               |
| ---------- | ------------------------ |
| Framework  | NestJS                   |
| HTTP       | Fastify                  |
| Database   | Drizzle ORM (PostgreSQL) |
| Auth       | JWT + httpOnly cookies   |
| Queue      | BullMQ (Redis-backed)    |
| Validation | Zod                      |
| Logging    | Pino                     |
| i18n       | nestjs-i18n              |

## Project Structure

```
src/
├── main.ts                 # App entry point
├── app.module.ts           # Root module
├── config/
│   ├── env.schema.ts       # Zod env validation
│   └── index.ts            # Config exports
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts  # Login, register, logout, me
│   ├── auth.service.ts     # Auth business logic
│   ├── auth.repository.ts  # User queries
│   └── org-access.provider.ts
├── user/
│   ├── user.module.ts
│   ├── user.controller.ts  # CRUD endpoints
│   ├── user.service.ts
│   └── user.repository.ts
├── org/
│   ├── org.module.ts
│   ├── org.controller.ts   # Organization management
│   ├── org.service.ts
│   └── org.repository.ts
├── jobs/
│   ├── jobs.module.ts
│   ├── jobs.controller.ts  # Queue job endpoints
│   └── index.ts
├── notifications/
│   ├── notification.module.ts
│   ├── notification.controller.ts
│   ├── notification.service.ts
│   └── notification.repository.ts
└── i18n/
    ├── i18n.module.ts
    ├── i18n.service.ts
    └── index.ts
```

## API Endpoints

### Authentication

| Method | Endpoint                    | Auth     | Description               |
| ------ | --------------------------- | -------- | ------------------------- |
| POST   | `/api/auth/login`           | Public   | Login with email/password |
| POST   | `/api/auth/register`        | Public   | Register new user         |
| POST   | `/api/auth/logout`          | Required | Logout current session    |
| POST   | `/api/auth/logout-all`      | Required | Logout all devices        |
| GET    | `/api/auth/me`              | Required | Get current user          |
| POST   | `/api/auth/change-password` | Required | Change password           |

### Users

| Method | Endpoint         | Auth     | Roles        |
| ------ | ---------------- | -------- | ------------ |
| GET    | `/api/users`     | Required | OWNER, ADMIN |
| GET    | `/api/users/:id` | Required | OWNER, ADMIN |
| POST   | `/api/users`     | Required | OWNER, ADMIN |
| PATCH  | `/api/users/:id` | Required | OWNER, ADMIN |
| DELETE | `/api/users/:id` | Required | OWNER, ADMIN |

### Organizations

| Method | Endpoint          | Auth     | Description                |
| ------ | ----------------- | -------- | -------------------------- |
| GET    | `/api/org`        | Required | List user's organizations  |
| POST   | `/api/org/switch` | Required | Switch active organization |

### Jobs

| Method | Endpoint                 | Auth     | Description           |
| ------ | ------------------------ | -------- | --------------------- |
| POST   | `/api/jobs/example`      | Required | Create background job |
| POST   | `/api/jobs/example/bulk` | Required | Create multiple jobs  |

### Notifications

| Method | Endpoint                          | Auth     | Description         |
| ------ | --------------------------------- | -------- | ------------------- |
| GET    | `/api/notifications`              | Required | List notifications  |
| GET    | `/api/notifications/unread-count` | Required | Get unread count    |
| PATCH  | `/api/notifications/:id/read`     | Required | Mark as read        |
| DELETE | `/api/notifications/:id`          | Required | Delete notification |

### Health

| Method | Endpoint  | Auth   | Description  |
| ------ | --------- | ------ | ------------ |
| GET    | `/health` | Public | Health check |

## Key Patterns

### Request Validation with Zod

Use `@ZodRequest()` decorator for body validation:

```typescript
@Post()
async create(
  @ZodRequest(CreateUserRequestSchema) dto: CreateUserRequest,
): Promise<CreateUserResponse> {
  return this.userService.create(dto);
}
```

For query params, parse manually:

```typescript
@Get()
async list(@Query() query: ListUsersRequest): Promise<ListUsersResponse> {
  const dto = ListUsersRequestSchema.parse(query);
  return this.userService.list(dto);
}
```

### Role-Based Access Control

Use `@Roles()` decorator to restrict endpoints:

```typescript
@Get()
@Roles(Role.OWNER, Role.ADMIN)
async list(): Promise<User[]> {
  return this.userService.list();
}
```

Available roles: `OWNER`, `ADMIN`, `MEMBER`

### Public Routes

Mark routes that don't require authentication:

```typescript
@PublicRoute()
@Post('login')
async login(@ZodRequest(LoginRequestSchema) dto: LoginRequest) {
  return this.authService.login(dto);
}
```

### Active User

Access the authenticated user in controllers:

```typescript
@Get('me')
async getProfile(
  @ActiveUser() activeUser: ActiveUserType,
): Promise<UserProfile> {
  return this.userService.getProfile(activeUser.userId);
}
```

`ActiveUser` contains: `userId`, `email`, `orgId`, `role`

### Enqueueing Jobs

Inject a producer and enqueue jobs:

```typescript
@Controller('tasks')
export class TaskController {
  constructor(private readonly producer: ExampleProducer) {}

  @Post()
  async createTask(@Body() dto: CreateTaskDto) {
    const job = await this.producer.enqueue({
      userId: dto.userId,
      action: 'process-task',
      data: dto.data,
    });
    return { jobId: job.id };
  }
}
```

## Adding a New Module

1. **Create module structure:**

   ```
   src/products/
   ├── products.module.ts
   ├── products.controller.ts
   ├── products.service.ts
   └── products.repository.ts
   ```

2. **Define contracts in `@pkg/contracts`:**

   ```typescript
   // packages/contracts/src/products.ts
   export const CreateProductRequestSchema = z.object({
     name: z.string(),
     price: z.number(),
   });
   export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
   ```

3. **Create controller:**

   ```typescript
   @Controller('products')
   export class ProductsController {
     constructor(private readonly service: ProductsService) {}

     @Post()
     @Roles(Role.ADMIN)
     async create(
       @ZodRequest(CreateProductRequestSchema) dto: CreateProductRequest,
       @ActiveUser() user: ActiveUserType,
     ): Promise<CreateProductResponse> {
       return this.service.create(user, dto);
     }
   }
   ```

4. **Register in `app.module.ts`:**

   ```typescript
   @Module({
     imports: [
       // ...existing modules
       ProductsModule,
     ],
   })
   export class AppModule {}
   ```

## Environment Variables

| Variable                   | Required | Default       | Description                          |
| -------------------------- | -------- | ------------- | ------------------------------------ |
| `NODE_ENV`                 | No       | `development` | Environment mode                     |
| `PORT`                     | No       | `3000`        | HTTP port                            |
| `DATABASE_URL`             | Yes      | -             | PostgreSQL connection URL            |
| `DATABASE_MAX_CONNECTIONS` | No       | `10`          | Max DB pool connections              |
| `IAM_AUTH_PROVIDER`        | No       | `local`       | Auth provider                        |
| `IAM_JWT_SECRET`           | Yes      | -             | JWT signing secret (min 32 chars)    |
| `IAM_COOKIE_SECRET`        | Yes      | -             | Cookie signing secret (min 32 chars) |
| `IAM_ACCESS_TOKEN_TTL`     | No       | `900`         | Access token TTL (seconds)           |
| `IAM_MAX_SESSION_TTL`      | No       | `86400`       | Max session TTL (seconds)            |
| `IAM_REDIS_HOST`           | No       | `localhost`   | Redis host for auth                  |
| `IAM_REDIS_PORT`           | No       | `6379`        | Redis port for auth                  |
| `IAM_REDIS_PASSWORD`       | No       | -             | Redis password                       |
| `REDIS_HOST`               | No       | `localhost`   | Redis host for queues                |
| `REDIS_PORT`               | No       | `6379`        | Redis port for queues                |
| `REDIS_PASSWORD`           | No       | -             | Redis password                       |

## Commands

```bash
# Development
pnpm dev              # Start with watch mode

# Production
pnpm build            # Build to dist/
pnpm start            # Run built app
pnpm start:prod       # Run in production mode

# Code Quality
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm typecheck        # TypeScript check
```

## Security Features

- **httpOnly cookies** - Tokens stored in signed httpOnly cookies
- **Token blacklisting** - Access tokens blacklisted on logout
- **Password hashing** - bcrypt with salt rounds
- **Header hardening** - X-Content-Type-Options, no X-Powered-By
- **Log redaction** - Sensitive headers auto-redacted
- **Zod validation** - All inputs validated at boundary

## Logging

Structured JSON logging via Pino:

- **Development:** Pretty-printed multi-line logs
- **Production:** JSON logs with request IDs

Request ID propagation via `X-Request-ID` header.

## Related Packages

- `@pkg/server` - Shared guards, decorators, IAM service, queue producers
- `@pkg/database` - Database schema and client
- `@pkg/contracts` - Request/response schemas and types
- `@pkg/locales` - Translation keys
- `@pkg/utils` - Shared utility functions
