import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AppEvents,
  type ExampleTaskStartedEvent,
  type ExampleTaskCompletedEvent,
  type ExampleTaskFailedEvent,
} from '@pkg/server';
import { NotificationRepository } from './notification.repository';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Example event listener.
 * Catches domain events and creates notifications in the database.
 */
@Injectable()
export class ExampleListener {
  constructor(
    @InjectPinoLogger(ExampleListener.name) private readonly logger: PinoLogger,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @OnEvent(AppEvents.EXAMPLE_TASK_STARTED)
  handleTaskStarted(event: ExampleTaskStartedEvent): void {
    this.logger.info({ taskId: event.taskId, taskType: event.taskType }, 'Task started');
  }

  @OnEvent(AppEvents.EXAMPLE_TASK_COMPLETED)
  async handleTaskCompleted(event: ExampleTaskCompletedEvent): Promise<void> {
    this.logger.info({ taskId: event.taskId, durationMs: event.durationMs }, 'Task completed');

    try {
      await this.notificationRepository.create({
        userId: event.initiatedBy,
        type: 'success',
        channel: 'in_app',
        title: 'Task Completed',
        message: `Task "${event.taskType}" completed successfully in ${event.durationMs}ms.`,
        // link: '/settings',
        data: {
          taskId: event.taskId,
          taskType: event.taskType,
          durationMs: event.durationMs,
        },
      });
      this.logger.debug({ taskId: event.taskId }, 'Notification created for completed task');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to create notification');
    }
  }

  @OnEvent(AppEvents.EXAMPLE_TASK_FAILED)
  async handleTaskFailed(event: ExampleTaskFailedEvent): Promise<void> {
    this.logger.warn({ taskId: event.taskId, error: event.error }, 'Task failed');

    try {
      await this.notificationRepository.create({
        userId: event.initiatedBy,
        type: 'error',
        channel: 'in_app',
        title: 'Task Failed',
        message: `Task "${event.taskType}" failed: ${event.error}`,
        // link: '/settings',
        data: {
          taskId: event.taskId,
          taskType: event.taskType,
          error: event.error,
        },
      });
      this.logger.debug({ taskId: event.taskId }, 'Notification created for failed task');
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to create notification');
    }
  }
}
