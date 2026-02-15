import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_JOB_OPTIONS } from './queues.config';
import { EXAMPLE_QUEUE, ExampleProducer } from './example';

/**
 * Shared queues module.
 * Registers BullMQ with Redis connection and all queue producers.
 *
 * Import this module in your API app to enqueue jobs.
 *
 * @example
 * ```typescript
 * // apps/api/src/app.module.ts
 * @Module({
 *   imports: [QueuesModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [
    // Register BullMQ with Redis connection
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    }),

    // Register queues
    BullModule.registerQueue({ name: EXAMPLE_QUEUE.name }),
  ],
  providers: [ExampleProducer],
  exports: [BullModule, ExampleProducer],
})
export class QueuesModule {}
