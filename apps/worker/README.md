# Worker App (`@pkg/worker`)

Background job processor for the vboilerplate platform. Consumes jobs from Redis queues and executes them asynchronously.

## Tech Stack

| Category   | Technology               |
| ---------- | ------------------------ |
| Framework  | NestJS                   |
| Queue      | BullMQ (Redis-backed)    |
| Database   | Drizzle ORM (PostgreSQL) |
| Events     | @nestjs/event-emitter    |
| Logging    | Pino                     |
| Validation | Zod                      |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API App   │────▶│    Redis    │────▶│   Worker    │
│  (Producer) │     │   (Queue)   │     │ (Processor) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  PostgreSQL │
                                        │   (Results) │
                                        └─────────────┘
```

**Flow:**

1. API enqueues job via `ExampleProducer.enqueue()`
2. Job is stored in Redis queue
3. Worker picks up job and runs processor
4. Processor emits events on completion/failure
5. Listener catches events and creates notifications in database

## Project Structure

```
src/
├── main.ts                 # App entry point
├── app.module.ts           # Root module
├── config/
│   ├── env.schema.ts       # Zod env validation
│   └── index.ts            # Config exports
└── queues/
    ├── index.ts            # Module exports
    ├── queues.module.ts    # Queue registration
    └── example/
        ├── example.processor.ts      # Job handler
        ├── example.listener.ts       # Event listener
        └── notification.repository.ts # Database access
```

## Key Concepts

### Processors

Handle jobs from queues. Extend `WorkerHost` and implement `process()`:

```typescript
@Processor(EXAMPLE_QUEUE.name, EXAMPLE_QUEUE.workerOptions)
export class ExampleProcessor extends WorkerHost {
  async process(job: Job<ExampleJobPayload>): Promise<ExampleJobResult> {
    // Process the job
    switch (job.data.action) {
      case 'send-email':
        await this.sendEmail(job.data);
        break;
    }
    return { success: true };
  }
}
```

### Event Listeners

React to domain events (task started/completed/failed):

```typescript
@Injectable()
export class ExampleListener {
  @OnEvent(AppEvents.EXAMPLE_TASK_COMPLETED)
  async handleTaskCompleted(event: ExampleTaskCompletedEvent): Promise<void> {
    await this.notificationRepository.create({
      userId: event.initiatedBy,
      type: 'success',
      title: 'Task Completed',
      message: `Task completed in ${event.durationMs}ms`,
    });
  }
}
```

### Worker Events

Handle BullMQ worker lifecycle events:

```typescript
@OnWorkerEvent('completed')
onCompleted(job: Job): void {
  this.logger.debug({ jobId: job.id }, 'Job completed');
}

@OnWorkerEvent('failed')
onFailed(job: Job, error: Error): void {
  this.logger.error({ jobId: job.id, err: error }, 'Job failed');
}

@OnWorkerEvent('stalled')
onStalled(jobId: string): void {
  this.logger.warn({ jobId }, 'Job stalled');
}
```

## Adding a New Queue

1. **Define queue config in `@pkg/server`:**

   ```typescript
   // packages/server/src/queues/my-queue.ts
   export const MY_QUEUE = {
     name: 'my-queue',
     workerOptions: { concurrency: 5 },
   };

   export type MyJobPayload = { userId: string; data: string };
   export type MyJobResult = { success: boolean };
   ```

2. **Create producer in `@pkg/server`:**

   ```typescript
   // packages/server/src/queues/my-queue.producer.ts
   @Injectable()
   export class MyQueueProducer {
     constructor(@InjectQueue(MY_QUEUE.name) private queue: Queue) {}

     async enqueue(payload: MyJobPayload): Promise<Job> {
       return this.queue.add('process', payload);
     }
   }
   ```

3. **Create processor in worker app:**

   ```typescript
   // apps/worker/src/queues/my-queue/my-queue.processor.ts
   @Processor(MY_QUEUE.name, MY_QUEUE.workerOptions)
   export class MyQueueProcessor extends WorkerHost {
     async process(job: Job<MyJobPayload>): Promise<MyJobResult> {
       // Handle the job
       return { success: true };
     }
   }
   ```

4. **Register processor:**

   ```typescript
   // apps/worker/src/queues/queues.module.ts
   @Module({
     imports: [SharedQueuesModule],
     providers: [
       ExampleProcessor,
       MyQueueProcessor, // Add here
     ],
   })
   export class WorkerQueuesModule {}
   ```

## Environment Variables

| Variable                   | Required | Default       | Description               |
| -------------------------- | -------- | ------------- | ------------------------- |
| `NODE_ENV`                 | No       | `development` | Environment mode          |
| `DATABASE_URL`             | Yes      | -             | PostgreSQL connection URL |
| `DATABASE_MAX_CONNECTIONS` | No       | `5`           | Max DB pool connections   |
| `REDIS_HOST`               | No       | `localhost`   | Redis host                |
| `REDIS_PORT`               | No       | `6379`        | Redis port                |
| `REDIS_PASSWORD`           | No       | -             | Redis password            |
| `WORKER_PORT`              | No       | `3001`        | Worker HTTP port          |

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

## Health Check

Worker exposes a health endpoint at `GET /health` (via `HealthModule`).

## Logging

Uses structured JSON logging via Pino:

- **Development:** Pretty-printed single-line logs
- **Production:** JSON logs with request IDs

Sensitive headers (`authorization`, `cookie`) are automatically redacted.

## Scaling

Workers can be scaled horizontally. Each worker instance:

- Connects to the same Redis queue
- Processes jobs concurrently (configurable per queue)
- Handles job retries automatically

```bash
# Scale to 3 worker instances
docker compose up --scale worker=3
```

## Related Packages

- `@pkg/server` - Queue definitions, producers, shared modules
- `@pkg/database` - Database schema and client
- `@pkg/contracts` - Shared TypeScript types
