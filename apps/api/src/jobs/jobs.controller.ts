import { Controller, Post } from '@nestjs/common';
import { ExampleProducer, type ExampleJobPayload } from '@pkg/server';
import { PublicRoute, ZodRequest } from '@pkg/server';
import {
  CreateExampleJobRequest,
  CreateExampleJobRequestSchema,
  CreateExampleJobResponse,
  CreateExampleJobsBulkRequest,
  CreateExampleJobsBulkRequestSchema,
  CreateExampleJobsBulkResponse,
} from '@pkg/contracts';

/**
 * Controller for managing background jobs.
 * Demonstrates how to enqueue jobs from the API.
 */
@Controller('jobs')
export class JobsController {
  constructor(private readonly exampleProducer: ExampleProducer) {}

  /**
   * Create an example job.
   *
   * @example
   * POST /jobs/example
   * {
   *   "userId": "user-123",
   *   "action": "send-email",
   *   "data": { "email": "test@example.com" }
   * }
   */
  @Post('example')
  @PublicRoute() // Remove this in production - just for testing
  async createExampleJob(
    @ZodRequest(CreateExampleJobRequestSchema) dto: CreateExampleJobRequest,
  ): Promise<CreateExampleJobResponse> {
    const payload: ExampleJobPayload = {
      userId: dto.userId,
      action: dto.action,
      data: dto.data,
    };

    const job = await this.exampleProducer.enqueue(payload, {
      priority: dto.priority,
      delay: dto.delay,
    });

    return {
      success: true,
      jobId: job.id,
      queue: job.queueName,
      message: 'Job queued successfully',
    };
  }

  /**
   * Create multiple example jobs in bulk.
   *
   * @example
   * POST /jobs/example/bulk
   * {
   *   "jobs": [
   *     { "userId": "user-1", "action": "send-email", "data": {} },
   *     { "userId": "user-2", "action": "sync-data", "data": {} }
   *   ]
   * }
   */
  @Post('example/bulk')
  @PublicRoute() // Remove this in production - just for testing
  async createExampleJobsBulk(
    @ZodRequest(CreateExampleJobsBulkRequestSchema) dto: CreateExampleJobsBulkRequest,
  ): Promise<CreateExampleJobsBulkResponse> {
    const payloads: ExampleJobPayload[] = dto.jobs.map((job) => ({
      userId: job.userId,
      action: job.action,
      data: job.data,
    }));

    const results = await this.exampleProducer.enqueueBulk(payloads);

    return {
      success: true,
      count: results.length,
      jobIds: results.map((r) => r.id),
      message: `${results.length} jobs queued successfully`,
    };
  }
}
