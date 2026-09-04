import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from './throttler.guard.js';

/**
 * Registers the global rate-limit guard.
 *
 * ORDER IS LOAD-BEARING. Nest runs global guards in the order their
 * providers were scanned, and the ROOT module's providers are scanned before
 * any imported module's. Declaring `{ provide: APP_GUARD, useClass:
 * AppThrottlerGuard }` in AppModule therefore ran the throttler BEFORE
 * AuthGuard, `req.user` was still unset, and every authenticated caller was
 * keyed by IP — one shared bucket for everyone behind a carrier NAT, the
 * exact failure the tracker exists to prevent. The in-process pipeline suite
 * caught it (two users from one IP shared a budget); no mocked unit test could.
 *
 * Import this module AFTER the IAM modules in the app's `imports`, so the
 * guard is scanned after the auth chain and sees the verified user.
 */
@Module({
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class ThrottlingModule {}
