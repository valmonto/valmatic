import { describe, expect, it } from 'vitest';
import { DEFAULT_JOB_OPTIONS } from '../../../src/modules/queues/queues.config.js';

describe('DEFAULT_JOB_OPTIONS', () => {
  it('keeps a bounded number of finished and failed jobs, so Redis cannot fill up', () => {
    expect(DEFAULT_JOB_OPTIONS?.removeOnComplete).toEqual({ count: 100 });
    expect(DEFAULT_JOB_OPTIONS?.removeOnFail).toEqual({ count: 500 });
  });
});
