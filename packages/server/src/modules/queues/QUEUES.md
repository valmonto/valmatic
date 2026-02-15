# Queue System Documentation

This document covers the BullMQ queue system architecture, usage patterns, and scaling strategies.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Basic Usage](#basic-usage)
- [Adding New Queues](#adding-new-queues)
- [Scaling Strategies](#scaling-strategies)
- [Configuration Reference](#configuration-reference)

---

## Overview

The queue system uses [BullMQ](https://docs.bullmq.io/) with Redis for reliable job processing.

**Key concepts:**

| Term | Description |
|------|-------------|
| **Producer** | Service that adds jobs to a queue (runs in API) |
| **Processor** | Worker that processes jobs from a queue (runs in Worker) |
| **Queue** | Redis-backed job queue |
| **Job** | Unit of work with payload and options |

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    apps/api     │         │   apps/worker   │
│                 │  Redis  │                 │
│  Enqueue jobs ──┼────────►│  Process jobs   │
│  (Producer)     │  Queue  │  (Consumer)     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │ packages/   │
              │ server      │
              │             │
              │ - Queue names│
              │ - Job types │
              │ - Producers │
              └─────────────┘
```

### Directory Structure

```
packages/server/src/modules/queues/
├── index.ts
├── queues.config.ts              # Redis config, default job options
├── queues.module.ts              # BullMQ registration
└── example/                      # Feature folder
    ├── index.ts
    ├── example.constants.ts      # Queue name + worker config
    ├── example.types.ts          # Job payload types
    └── example.producer.ts       # Service to enqueue jobs

apps/worker/src/queues/
├── index.ts
├── queues.module.ts              # Imports shared, registers processors
└── example/
    └── example.processor.ts      # Job processing logic
```

---

## Basic Usage

### Enqueueing Jobs (API Side)

```typescript
import { ExampleProducer } from '@pkg/server';

@Controller('tasks')
export class TasksController {
  constructor(private exampleProducer: ExampleProducer) {}

  @Post()
  async createTask(@Body() dto: CreateTaskDto) {
    await this.exampleProducer.enqueue({
      userId: dto.userId,
      action: 'send-email',
      data: { email: dto.email },
    });
    return { queued: true };
  }
}
```

### Processing Jobs (Worker Side)

```typescript
@Processor(EXAMPLE_QUEUE.name, EXAMPLE_QUEUE.workerOptions)
export class ExampleProcessor extends WorkerHost {
  async process(job: Job<ExampleJobPayload>): Promise<ExampleJobResult> {
    // Do work...
    return { success: true, processedAt: new Date().toISOString() };
  }
}
```

---

## Adding New Queues

### Step 1: Create Constants

```typescript
// packages/server/src/modules/queues/my-feature/my-feature.constants.ts
import type { WorkerOptions } from 'bullmq';

export const MY_FEATURE_QUEUE = {
  name: 'my-feature',
  workerOptions: {
    concurrency: 5,
    lockDuration: 60_000,
  } satisfies Partial<WorkerOptions>,
} as const;
```

### Step 2: Define Types

```typescript
// packages/server/src/modules/queues/my-feature/my-feature.types.ts
export interface MyFeatureJobPayload {
  userId: string;
  // ... your payload
}

export interface MyFeatureJobResult {
  success: boolean;
}
```

### Step 3: Create Producer

```typescript
// packages/server/src/modules/queues/my-feature/my-feature.producer.ts
@Injectable()
export class MyFeatureProducer {
  constructor(@InjectQueue(MY_FEATURE_QUEUE.name) private queue: Queue) {}

  async enqueue(payload: MyFeatureJobPayload) {
    return this.queue.add('process', payload);
  }
}
```

### Step 4: Register Queue

```typescript
// packages/server/src/modules/queues/queues.module.ts
@Module({
  imports: [
    BullModule.registerQueue(
      { name: EXAMPLE_QUEUE.name },
      { name: MY_FEATURE_QUEUE.name }, // Add here
    ),
  ],
  providers: [ExampleProducer, MyFeatureProducer], // Add here
  exports: [ExampleProducer, MyFeatureProducer],   // Add here
})
export class QueuesModule {}
```

### Step 5: Create Processor

```typescript
// apps/worker/src/queues/my-feature/my-feature.processor.ts
@Processor(MY_FEATURE_QUEUE.name, MY_FEATURE_QUEUE.workerOptions)
export class MyFeatureProcessor extends WorkerHost {
  async process(job: Job<MyFeatureJobPayload>): Promise<MyFeatureJobResult> {
    // Process job...
    return { success: true };
  }
}
```

### Step 6: Register Processor

```typescript
// apps/worker/src/queues/queues.module.ts
@Module({
  imports: [SharedQueuesModule],
  providers: [ExampleProcessor, MyFeatureProcessor], // Add here
})
export class WorkerQueuesModule {}
```

---

## Scaling Strategies

### Queue Weight Classes

For different resource profiles, categorize queues:

| Profile | Concurrency | Lock Duration | Use Case |
|---------|-------------|---------------|----------|
| **Light** | 50 | 30 sec | Notifications, emails |
| **Medium** | 10 | 5 min | Reports, exports |
| **Heavy** | 1-3 | 1 hour | Video processing, ML tasks |

```typescript
export const QUEUE_PROFILES = {
  LIGHT: {
    concurrency: 50,
    lockDuration: 30_000,
  },
  MEDIUM: {
    concurrency: 10,
    lockDuration: 5 * 60_000,
  },
  HEAVY: {
    concurrency: 1,
    lockDuration: 60 * 60_000,
    stalledInterval: 5 * 60_000,
  },
} as const;
```

### Deploying Separate Workers

Deploy different worker instances for different queue types:

```yaml
# docker-compose.yml
services:
  worker-light:
    image: myapp/worker
    environment:
      WORKER_TYPE: light
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M

  worker-heavy:
    image: myapp/worker
    environment:
      WORKER_TYPE: heavy
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 8G
```

### Selective Processor Registration

```typescript
// apps/worker/src/queues/queues.module.ts
@Module({
  imports: [SharedQueuesModule],
  providers: getProcessorsForWorkerType(),
})
export class WorkerQueuesModule {}

function getProcessorsForWorkerType() {
  const type = process.env.WORKER_TYPE ?? 'all';

  switch (type) {
    case 'light':
      return [NotificationProcessor, EmailProcessor];
    case 'heavy':
      return [CourseBuilderProcessor, VideoProcessor];
    case 'all':
    default:
      return [/* all processors */];
  }
}
```

### Horizontal Scaling

BullMQ automatically distributes jobs across workers connecting to the same queue:

```
┌─────────────┐
│   Redis     │
│  (Queues)   │
└──────┬──────┘
       │
  ┌────┴────┬────────────┐
  │         │            │
  ▼         ▼            ▼
Worker    Worker      Worker
Light-1   Light-2     Heavy-1
(512MB)   (512MB)     (8GB)
conc:50   conc:50     conc:1
```

### Job Chunking (For Very Large Jobs)

Break large jobs into smaller child jobs:

```typescript
await this.flow.add({
  name: 'course-complete',
  queueName: 'course-orchestrator',
  data: { courseId: '123' },
  children: [
    { queueName: 'process-video', data: { videoId: 'v1' } },
    { queueName: 'process-video', data: { videoId: 'v2' } },
    { queueName: 'generate-pdf', data: { pdfId: 'p1' } },
  ],
});
```

---

## Configuration Reference

### Worker Options

| Option | Description | Default |
|--------|-------------|---------|
| `concurrency` | Max parallel jobs per worker | 1 |
| `lockDuration` | Time before job is considered stalled (ms) | 30000 |
| `stalledInterval` | How often to check for stalled jobs (ms) | 30000 |
| `maxStalledCount` | Max times job can stall before failing | 1 |

### Job Options

| Option | Description | Default |
|--------|-------------|---------|
| `priority` | Lower = higher priority | - |
| `delay` | Delay before processing (ms) | 0 |
| `attempts` | Max retry attempts | 3 |
| `backoff` | Retry delay strategy | exponential |
| `removeOnComplete` | Remove job data after completion | true |
| `removeOnFail` | Remove job data after failure | false |

### Example Heavy Job Configuration

```typescript
export const HEAVY_QUEUE = {
  name: 'heavy-processing',
  workerOptions: {
    concurrency: 1,
    lockDuration: 60 * 60 * 1000,      // 1 hour
    stalledInterval: 5 * 60 * 1000,    // Check every 5 min
    maxStalledCount: 1,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 60_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  },
} as const;
```

---

## Best Practices

1. **Type your payloads** - Always define interfaces for job data
2. **Use appropriate concurrency** - Heavy jobs = low concurrency
3. **Set lock duration** - Should exceed max expected job time
4. **Handle failures** - Use `@OnWorkerEvent('failed')` for logging
5. **Keep jobs idempotent** - Jobs may be retried
6. **Don't store large data** - Pass IDs, fetch data in processor
7. **Monitor queue depth** - Alert on growing backlogs

---

## Troubleshooting

### Job Stuck in "active"

- Check `lockDuration` is long enough
- Check for unhandled exceptions in processor
- Check Redis connection

### Jobs Not Processing

- Verify worker is running and connected to Redis
- Check processor is registered in `WorkerQueuesModule`
- Check queue name matches between producer and processor

### Memory Issues

- Reduce concurrency for heavy jobs
- Use job chunking for large data
- Deploy separate workers for heavy queues
