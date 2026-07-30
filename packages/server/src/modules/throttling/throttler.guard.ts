import { HttpException, HttpStatus, Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ActiveUser } from '@pkg/contracts';
import { k } from '@pkg/locales';

interface TrackableRequest {
  ip: string;
  user?: ActiveUser;
}

/**
 * Bucket identity for a request.
 *
 * Authenticated → the VERIFIED userId: every user gets their own budget
 * regardless of network, which is what carrier NAT requires (thousands of
 * mobile users share one IP; pure-IP buckets would let them exhaust each
 * other's quota).
 *
 * Unauthenticated (public routes — login, register) → the IP alone. There is
 * no user yet, and nothing the CLIENT controls may enter the key, or an
 * attacker could mint fresh buckets and walk past the spray limit.
 *
 * This guard runs AFTER the auth chain, so req.user is real, not a claimed
 * header. The cost of that order is that requests rejected by AuthGuard
 * (bad tokens → 401) never reach the throttler — acceptable, because
 * guessing a signed JWT is not a spray anyone wins.
 */
export function throttlerTracker(req: TrackableRequest): string {
  return req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve(throttlerTracker(req as unknown as TrackableRequest));
  }

  protected override throwThrottlingException(_context: ExecutionContext): Promise<void> {
    // Same body shape as GlobalExceptionFilter, message as a k.* key so
    // clients translate it like every other error.
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: k.auth.errors.tooManyRequests,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
