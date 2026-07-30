import type { ActiveUser } from '@pkg/contracts';
import type { ExampleProducer } from '@pkg/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobsController } from '@/jobs/jobs.controller';

const caller: ActiveUser = {
  userId: '11111111-1111-4111-8111-111111111111',
  orgId: '22222222-2222-4222-8222-222222222222',
  orgRole: 'ADMIN',
  systemRole: 'USER',
};

describe('JobsController', () => {
  let controller: JobsController;
  let enqueue: ReturnType<typeof vi.fn>;
  let enqueueBulk: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    enqueue = vi.fn().mockResolvedValue({ id: 'job-1', queueName: 'example' });
    enqueueBulk = vi.fn().mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]);
    controller = new JobsController({ enqueue, enqueueBulk } as unknown as ExampleProducer);
  });

  /**
   * The payload identity must come from the session, never the request. The
   * request schema has no userId field, but a schema can regain one in a
   * refactor — this pins the controller to the session regardless.
   */
  it('attributes the job to the session user and organization', async () => {
    await controller.createExampleJob({ action: 'send-email', data: {} }, caller);

    expect(enqueue).toHaveBeenCalledWith(
      { userId: caller.userId, orgId: caller.orgId, action: 'send-email', data: {} },
      expect.anything(),
    );
  });

  it('passes priority and delay through as queue options', async () => {
    await controller.createExampleJob(
      { action: 'sync-data', data: {}, priority: 3, delay: 5000 },
      caller,
    );

    expect(enqueue).toHaveBeenCalledWith(expect.anything(), { priority: 3, delay: 5000 });
  });

  it('attributes every bulk job to the session, whatever the payload count', async () => {
    await controller.createExampleJobsBulk(
      {
        jobs: [
          { action: 'send-email', data: { to: 'a' } },
          { action: 'sync-data', data: { to: 'b' } },
        ],
      },
      caller,
    );

    const payloads = enqueueBulk.mock.calls[0]![0] as Array<{ userId: string; orgId: string }>;
    expect(payloads).toHaveLength(2);
    for (const payload of payloads) {
      expect(payload).toMatchObject({ userId: caller.userId, orgId: caller.orgId });
    }
  });

  it('reports the ids of the enqueued jobs', async () => {
    const result = await controller.createExampleJobsBulk(
      { jobs: [{ action: 'send-email', data: {} }] },
      caller,
    );

    expect(result.count).toBe(2);
    expect(result.jobIds).toEqual(['job-1', 'job-2']);
  });
});
