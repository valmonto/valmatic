import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { PublicRoute, IS_PUBLIC_KEY } from '../../../../../src/modules/iam/auth-providers/decorators/public-route.decorator';

describe('PublicRoute', () => {
  const reflector = new Reflector();

  it('should set IS_PUBLIC_KEY metadata to true', () => {
    @PublicRoute()
    class TestController {}

    const isPublic = reflector.get(IS_PUBLIC_KEY, TestController);

    expect(isPublic).toBe(true);
  });

  it('should work on methods', () => {
    class TestController {
      @PublicRoute()
      testMethod() {}
    }

    const isPublic = reflector.get(IS_PUBLIC_KEY, TestController.prototype.testMethod);

    expect(isPublic).toBe(true);
  });

  it('should not affect other classes', () => {
    @PublicRoute()
    class PublicController {}

    class PrivateController {}

    expect(reflector.get(IS_PUBLIC_KEY, PublicController)).toBe(true);
    expect(reflector.get(IS_PUBLIC_KEY, PrivateController)).toBeUndefined();
  });
});
