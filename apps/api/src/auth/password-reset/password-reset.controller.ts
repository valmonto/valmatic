import { Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectLogger, PinoLogger, PublicRoute, ZodRequest } from '@pkg/server';
import {
  PasswordResetCheckRequestSchema,
  PasswordResetConfirmRequestSchema,
  PasswordResetRequestSchema,
  type PasswordResetCheckRequest,
  type PasswordResetCheckResponse,
  type PasswordResetConfirmRequest,
  type PasswordResetConfirmResponse,
  type PasswordResetRequest,
  type PasswordResetRequestResponse,
} from '@pkg/contracts';
import { AUTH_THROTTLE } from '../../config/index.js';
import { PasswordResetService } from './password-reset.service.js';

/**
 * "I forgot my password". All three routes are public — whoever calls them
 * cannot sign in — and all three sit behind the per-address spray limit that
 * login does.
 */
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(
    private readonly resets: PasswordResetService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /**
   * Ask for the email. Answers at once and always the same, and does the
   * work AFTER answering: how long the lookup and the mail service take must
   * not tell a caller whether the address has an account.
   */
  @PublicRoute()
  @Post('request')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  request(
    @ZodRequest(PasswordResetRequestSchema) dto: PasswordResetRequest,
  ): PasswordResetRequestResponse {
    void this.resets.request(dto).catch((error: unknown) => {
      this.logger.error({ err: error }, 'Password reset request failed');
    });
    return {};
  }

  /** Is this link still good? For the page the link opens. */
  @PublicRoute()
  @Post('check')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async check(
    @ZodRequest(PasswordResetCheckRequestSchema) dto: PasswordResetCheckRequest,
  ): Promise<PasswordResetCheckResponse> {
    return { valid: await this.resets.check(dto.token) };
  }

  @PublicRoute()
  @Post('confirm')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async confirm(
    @ZodRequest(PasswordResetConfirmRequestSchema) dto: PasswordResetConfirmRequest,
  ): Promise<PasswordResetConfirmResponse> {
    await this.resets.confirm(dto);
    return {};
  }
}
