import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue, type JobsOptions } from 'bullmq';
import { EXAMPLE_QUEUE } from './example.constants';
import { EXAMPLE_JOB_NAMES, type ExampleJobPayload } from './example.types';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Producer service for the example queue.
 * Use this to add jobs from your API or other services.
 *
 * @example
 * ```typescript
 * @Controller('tasks')
 * export class TasksController {
 *   constructor(private exampleProducer: ExampleProducer) {}
 *
 *   @Post()
 *   async createTask(@Body() dto: CreateTaskDto) {
 *     await this.exampleProducer.enqueue({
 *       userId: dto.userId,
 *       action: 'send-email',
 *       data: { email: dto.email },
 *     });
 *     return { queued: true };
 *   }
 * }
 * ```
 */
@Injectable()
export class ExampleProducer {
  constructor(
    @InjectPinoLogger(ExampleProducer.name) private readonly logger: PinoLogger,
    @InjectQueue(EXAMPLE_QUEUE.name) private readonly queue: Queue<ExampleJobPayload>,
  ) {}

  /**
   * Add a job to the example queue.
   *
   * @param payload - The job data
   * @param options - Optional job configuration
   * @returns The created job
   */
  async enqueue(payload: ExampleJobPayload, options?: { priority?: number; delay?: number }) {
    const jobOptions: JobsOptions = {
      priority: options?.priority,
      delay: options?.delay,
    };

    const job = await this.queue.add(EXAMPLE_JOB_NAMES.PROCESS, payload, jobOptions);

    this.logger.info(`Enqueued job ${job.id} for user ${payload.userId}: ${payload.action}`);

    return job;
  }

  /**
   * Add multiple jobs to the queue in bulk.
   *
   * @param payloads - Array of job payloads
   * @returns Array of created jobs
   */
  async enqueueBulk(payloads: ExampleJobPayload[]) {
    const jobs = payloads.map((payload) => ({
      name: EXAMPLE_JOB_NAMES.PROCESS,
      data: payload,
    }));

    const results = await this.queue.addBulk(jobs);

    this.logger.info(`Enqueued ${results.length} jobs in bulk`);

    return results;
  }
}
