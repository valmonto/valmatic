import { describe, expect, it } from 'vitest';
import { readBuildInfo } from '../../../src/modules/health/build-info.js';

const SHA = '1b029f6c1d5e8a3b9f0e7d6c5b4a3f2e1d0c9b8a';

describe('readBuildInfo', () => {
  it('serves the full and short sha plus builtAt when the build args were passed', () => {
    const info = readBuildInfo({ GIT_SHA: SHA, BUILT_AT: '2026-09-03T18:50:40Z' });

    expect(info).toEqual({
      sha: SHA,
      shortSha: '1b029f6',
      builtAt: '2026-09-03T18:50:40.000Z',
    });
  });

  it('reports sha: null when GIT_SHA is absent (local dev, or a build that forgot the arg)', () => {
    expect(readBuildInfo({})).toEqual({ sha: null, shortSha: null, builtAt: null });
    expect(readBuildInfo({ GIT_SHA: '', BUILT_AT: '' }).sha).toBeNull();
  });

  it('never lets a placeholder look like a known version', () => {
    // A workflow that expands an unset variable, or someone typing "unknown",
    // must not produce a value that reads as a real commit.
    for (const bogus of [
      'unknown',
      'latest',
      '$(git rev-parse HEAD)',
      '1b029f6',
      'HEAD',
      SHA + 'x',
    ]) {
      expect(readBuildInfo({ GIT_SHA: bogus }).sha).toBeNull();
      expect(readBuildInfo({ GIT_SHA: bogus }).shortSha).toBeNull();
    }
  });

  it('normalizes case and whitespace but keeps the value', () => {
    expect(readBuildInfo({ GIT_SHA: ` ${SHA.toUpperCase()} ` }).sha).toBe(SHA);
  });

  it('reports builtAt: null for an unparseable timestamp', () => {
    expect(readBuildInfo({ GIT_SHA: SHA, BUILT_AT: 'yesterday' }).builtAt).toBeNull();
  });
});
