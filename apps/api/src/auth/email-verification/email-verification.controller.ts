import { Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ActiveUser, Permissions, PublicRoute, ZodRequest } from '@pkg/server';
import {
  ChangeUnverifiedEmailRequestSchema,
  EmailVerificationConfirmRequestSchema,
  EmailVerificationResendRequestSchema,
  type ActiveUser as ActiveUserType,
  type ChangeUnverifiedEmailRequest,
  type ChangeUnverifiedEmailResponse,
  type EmailVerificationConfirmRequest,
  type EmailVerificationConfirmResponse,
  type EmailVerificationResendRequest,
  type EmailVerificationResendResponse,
} from '@pkg/contracts';
import { AUTH_THROTTLE } from '../../config/index.js';
import { EmailVerificationService } from './email-verification.service.js';

/**
 * Confirming a user's email address. Sending again and correcting the
 * address need the account's own session (the same permission as changing
 * the password). Opening the link does not: it may be opened in any browser.
 */
@Controller('auth/email-verification')
export class EmailVerificationController {
  constructor(private readonly verifications: EmailVerificationService) {}

  @Post('resend')
  @HttpCode(200)
  @Permissions('auth:change-password')
  @Throttle(AUTH_THROTTLE)
  resend(
    @ZodRequest(EmailVerificationResendRequestSchema) dto: EmailVerificationResendRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<EmailVerificationResendResponse> {
    return this.verifications.resend(activeUser, dto.locale);
  }

  @PublicRoute()
  @Post('confirm')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async confirm(
    @ZodRequest(EmailVerificationConfirmRequestSchema) dto: EmailVerificationConfirmRequest,
  ): Promise<EmailVerificationConfirmResponse> {
    return { email: await this.verifications.confirm(dto.token) };
  }

  @Post('change')
  @HttpCode(200)
  @Permissions('auth:change-password')
  @Throttle(AUTH_THROTTLE)
  change(
    @ZodRequest(ChangeUnverifiedEmailRequestSchema) dto: ChangeUnverifiedEmailRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ChangeUnverifiedEmailResponse> {
    return this.verifications.changeUnverified(activeUser, dto);
  }
}
