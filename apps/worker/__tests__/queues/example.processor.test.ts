import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { PinoLogger } from 'nestjs-pino';
import { AppEvents, type ExampleJobPayload } from '@pkg/server';
import { FakeLogger } from '@pkg/testing';
import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExampleProcessor } from '@/queues/example/example.processor';

/**
 * The pattern for testing a processor: build it with fakes, hand `process()` a
 * job-shaped object, and assert on both the returned result and the events it
 * emitted — the events are how the rest of the system learns what happened, so
 * they are as much the contract as the return value.
 */
function jobOf(data: ExampleJobPayload, id = 'job-1'): Job<ExampleJobPayload> {
  return { id, data } as Job<ExampleJobPayload>;
}

describe('ExampleProcessor', () => {
  let processor: ExampleProcessor;
  let logger: FakeLogger;
  let emitted: Array<{ event: string; payload: unknown }>;
  let emitter: EventEmitter2;

  beforeEach(() => {
    logger = new FakeLogger();
    emitted = [];
    emitter = {
      emit: vi.fn((event: string, payload: unknown) => {
        emitted.push({ event, payload });
        return true;
      }),
    } as unknown as EventEmitter2;

    processor = new ExampleProcessor(logger.as<PinoLogger>(), emitter);
  });

  const eventNames = () => emitted.map((e) => e.event);

  it('returns a success result for a known action', async () => {
    const result = await processor.process(
      jobOf({ action: 'send-email', userId: 'u1', orgId: 'org-1', data: {} }),
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('send-email');
  });

  it('emits started then completed around successful work', async () => {
    await processor.process(jobOf({ action: 'sync-data', userId: 'u1', orgId: 'org-1', data: {} }));

    expect(eventNames()).toEqual([
      AppEvents.EXAMPLE_TASK_STARTED,
      AppEvents.EXAMPLE_TASK_COMPLETED,
    ]);
  });

  it('rethrows on an unknown action so BullMQ can retry', async () => {
    const job = jobOf({
      action: 'not-a-real-action',
      userId: 'u1',
      orgId: 'org-1',
      data: {},
    } as unknown as ExampleJobPayload);

    await expect(processor.process(job)).rejects.toThrow(/Unknown action/);
  });

  it('emits started then failed when the work throws', async () => {
    const job = jobOf({
      action: 'nope',
      userId: 'u1',
      orgId: 'org-1',
      data: {},
    } as unknown as ExampleJobPayload);

    await expect(processor.process(job)).rejects.toThrow();

    expect(eventNames()).toEqual([AppEvents.EXAMPLE_TASK_STARTED, AppEvents.EXAMPLE_TASK_FAILED]);
    expect(logger.logged('Job failed', 'error')).toBe(true);
  });

  it('carries the job id and initiator through to the events', async () => {
    await processor.process(
      jobOf({ action: 'send-email', userId: 'user-42', orgId: 'org-1', data: {} }, 'job-99'),
    );

    for (const { payload } of emitted) {
      expect(payload).toMatchObject({ taskId: 'job-99', initiatedBy: 'user-42' });
    }
  });
});
