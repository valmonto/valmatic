import { Controller, Post } from '@nestjs/common';
import { ExampleProducer, type ExampleJobPayload } from '@pkg/server';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  type ActiveUser as ActiveUserType,
  type CreateExampleJobRequest,
  CreateExampleJobRequestSchema,
  CreateExampleJobResponse,
  type CreateExampleJobsBulkRequest,
  CreateExampleJobsBulkRequestSchema,
  CreateExampleJobsBulkResponse,
} from '@pkg/contracts';

/**
 * Controller for managing background jobs.
 * Demonstrates how to enqueue jobs from the API.
 *
 * The job is attributed to the SESSION user and organization — the payload
 * carries no identity fields, because a caller-supplied identity would let
 * anyone enqueue work as someone else.
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
  @Permissions('job:create')
  async createExampleJob(
    @ZodRequest(CreateExampleJobRequestSchema) dto: CreateExampleJobRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateExampleJobResponse> {
    const payload: ExampleJobPayload = {
      userId: activeUser.userId,
      orgId: activeUser.orgId,
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
  @Permissions('job:create')
  async createExampleJobsBulk(
    @ZodRequest(CreateExampleJobsBulkRequestSchema) dto: CreateExampleJobsBulkRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateExampleJobsBulkResponse> {
    const payloads: ExampleJobPayload[] = dto.jobs.map((job) => ({
      userId: activeUser.userId,
      orgId: activeUser.orgId,
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
