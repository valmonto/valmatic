import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import {
  EXAMPLE_QUEUE,
  AppEvents,
  type ExampleJobPayload,
  type ExampleJobResult,
  type ExampleTaskStartedEvent,
  type ExampleTaskCompletedEvent,
  type ExampleTaskFailedEvent,
} from '@pkg/server';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Processor for the example queue.
 * Handles jobs enqueued by ExampleProducer.
 *
 * @example
 * Job flow:
 * 1. API calls ExampleProducer.enqueue()
 * 2. Job is added to Redis queue
 * 3. Worker picks up job and runs this processor
 * 4. Result is returned and job is marked complete
 */
@Processor(EXAMPLE_QUEUE.name, EXAMPLE_QUEUE.workerOptions)
export class ExampleProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(ExampleProcessor.name) private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  /**
   * Process a job from the queue.
   *
   * @param job - The job to process
   * @returns Result of the job processing
   */
  async process(job: Job<ExampleJobPayload>): Promise<ExampleJobResult> {
    const startTime = Date.now();
    this.logger.info(
      { jobId: job.id, action: job.data.action, userId: job.data.userId },
      'Processing job',
    );

    // Emit task started event
    this.eventEmitter.emit(AppEvents.EXAMPLE_TASK_STARTED, {
      taskId: job.id!,
      taskType: job.data.action,
      initiatedBy: job.data.userId,
      timestamp: new Date().toISOString(),
    } satisfies ExampleTaskStartedEvent);

    try {
      // Simulate work based on action type
      switch (job.data.action) {
        case 'send-email':
          await this.handleSendEmail(job.data);
          break;
        case 'generate-report':
          await this.handleGenerateReport(job.data);
          break;
        case 'sync-data':
          await this.handleSyncData(job.data);
          break;
        default:
          throw new Error(`Unknown action: ${job.data.action}`);
      }

      const durationMs = Date.now() - startTime;
      this.logger.info({ jobId: job.id, durationMs }, 'Job completed successfully');

      // Emit task completed event
      this.eventEmitter.emit(AppEvents.EXAMPLE_TASK_COMPLETED, {
        taskId: job.id!,
        taskType: job.data.action,
        initiatedBy: job.data.userId,
        result: { action: job.data.action },
        durationMs,
        timestamp: new Date().toISOString(),
      } satisfies ExampleTaskCompletedEvent);

      return {
        success: true,
        processedAt: new Date().toISOString(),
        message: `Action ${job.data.action} completed`,
      };
    } catch (error) {
      this.logger.error({ jobId: job.id, err: error }, 'Job failed');

      // Emit task failed event
      this.eventEmitter.emit(AppEvents.EXAMPLE_TASK_FAILED, {
        taskId: job.id!,
        taskType: job.data.action,
        initiatedBy: job.data.userId,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      } satisfies ExampleTaskFailedEvent);

      throw error;
    }
  }

  /**
   * Handle send-email action.
   * Replace with actual email sending logic.
   */
  private async handleSendEmail(data: ExampleJobPayload): Promise<void> {
    this.logger.debug({ userId: data.userId }, 'Sending email');
    await this.delay(100);
  }

  /**
   * Handle generate-report action.
   * Replace with actual report generation logic.
   */
  private async handleGenerateReport(data: ExampleJobPayload): Promise<void> {
    this.logger.debug({ userId: data.userId }, 'Generating report');
    await this.delay(200);
  }

  /**
   * Handle sync-data action.
   * Replace with actual data sync logic.
   */
  private async handleSyncData(data: ExampleJobPayload): Promise<void> {
    this.logger.debug({ userId: data.userId }, 'Syncing data');
    await this.delay(150);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────
  // Worker Events
  // ─────────────────────────────────────────────────────────────

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ExampleJobPayload>): void {
    this.logger.debug({ jobId: job.id }, 'Job completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ExampleJobPayload>, error: Error): void {
    this.logger.error(
      {
        jobId: job.id,
        userId: job.data.userId,
        action: job.data.action,
        err: error,
        attemptsMade: job.attemptsMade,
      },
      'Job failed after retries',
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn({ jobId }, 'Job stalled - will be reprocessed');
  }
}
