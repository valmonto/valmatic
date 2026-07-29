import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ActiveOrgGuard } from '../../../../../src/modules/iam/auth-providers/guards/active-org.guard';

const ORG = 'org-1';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWith(isPublic = false): ActiveOrgGuard {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(isPublic) } as unknown as Reflector;
  return new ActiveOrgGuard(reflector);
}

describe('ActiveOrgGuard', () => {
  it('lets public routes through without a session', () => {
    expect(guardWith(true).canActivate(contextFor({}))).toBe(true);
  });

  it('passes when the path names no organization', () => {
    const ctx = contextFor({ user: { userId: 'u1', orgId: ORG, role: 'MEMBER' }, params: {} });

    expect(guardWith().canActivate(ctx)).toBe(true);
  });

  it('passes when the path matches the session organization', () => {
    const ctx = contextFor({
      user: { userId: 'u1', orgId: ORG, role: 'MEMBER' },
      params: { orgId: ORG },
    });

    expect(guardWith().canActivate(ctx)).toBe(true);
  });

  // The path is client-supplied, so this is the case the guard exists for.
  it('rejects a path naming a different organization', () => {
    const ctx = contextFor({
      user: { userId: 'u1', orgId: ORG, role: 'OWNER' },
      params: { orgId: 'someone-elses-org' },
    });

    expect(() => guardWith().canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects an authenticated session with no organization', () => {
    const ctx = contextFor({ user: { userId: 'u1' }, params: { orgId: ORG } });

    expect(() => guardWith().canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects a non-public route with no user at all', () => {
    expect(() => guardWith().canActivate(contextFor({ params: {} }))).toThrow(ForbiddenException);
  });
});
