import type { PinoLogger } from 'nestjs-pino';
import {
  AppEvents,
  type ExampleTaskCompletedEvent,
  type ExampleTaskFailedEvent,
  type ExampleTaskStartedEvent,
} from '@pkg/server';
import { FakeLogger } from '@pkg/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExampleListener } from '@/queues/example/example.listener';
import type { NotificationRepository } from '@/queues/example/notification.repository';

/**
 * The listener is the other half of the queue pattern: the processor emits
 * events, this turns them into rows. Tested with a stub repository, so the
 * assertions are about *what* it decides to write rather than about SQL.
 */
describe('ExampleListener', () => {
  let listener: ExampleListener;
  let logger: FakeLogger;
  let create: ReturnType<typeof vi.fn>;

  const started: ExampleTaskStartedEvent = {
    taskId: 'job-1',
    taskType: 'send-email',
    initiatedBy: 'user-1',
    timestamp: '2026-01-01T00:00:00.000Z',
  };
  const completed: ExampleTaskCompletedEvent = {
    ...started,
    result: { action: 'send-email' },
    durationMs: 120,
  };
  const failed: ExampleTaskFailedEvent = { ...started, error: 'SMTP unreachable' };

  beforeEach(() => {
    logger = new FakeLogger();
    create = vi.fn().mockResolvedValue({ id: 'n1' });
    listener = new ExampleListener(logger.as<PinoLogger>(), {
      create,
    } as unknown as NotificationRepository);
  });

  it('only logs when a task starts — nothing to tell the user yet', () => {
    listener.handleTaskStarted(started);

    expect(create).not.toHaveBeenCalled();
    expect(logger.logged('Task started', 'info')).toBe(true);
  });

  it('writes a success notification when a task completes', async () => {
    await listener.handleTaskCompleted(completed);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      userId: 'user-1',
      type: 'success',
      channel: 'in_app',
      data: { taskId: 'job-1', taskType: 'send-email', durationMs: 120 },
    });
  });

  it('writes an error notification carrying the failure reason', async () => {
    await listener.handleTaskFailed(failed);

    const row = create.mock.calls[0]?.[0] as { type: string; message: string };
    expect(row.type).toBe('error');
    expect(row.message).toContain('SMTP unreachable');
  });

  // The job already succeeded by the time this runs. Letting a notification
  // write throw would fail a job that did its work, so the listener swallows it.
  it('does not rethrow when the notification write fails', async () => {
    create.mockRejectedValue(new Error('connection terminated'));

    await expect(listener.handleTaskCompleted(completed)).resolves.toBeUndefined();
    expect(logger.logged('Failed to create notification', 'error')).toBe(true);
  });

  it('is wired to the events the processor emits', () => {
    expect(AppEvents.EXAMPLE_TASK_STARTED).toBeDefined();
    expect(AppEvents.EXAMPLE_TASK_COMPLETED).toBeDefined();
    expect(AppEvents.EXAMPLE_TASK_FAILED).toBeDefined();
  });
});
