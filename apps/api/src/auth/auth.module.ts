import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginAttempts } from './login-attempts.js';
import { IamModule, IamService, ORG_ACCESS } from '@pkg/server';
import { AuthRepository } from './auth.repository.js';
import { OrgAccessProvider } from './org-access.provider.js';
import { PasswordResetController } from './password-reset/password-reset.controller.js';
import { EmailVerificationController } from './email-verification/email-verification.controller.js';
import { EmailVerificationRepository } from './email-verification/email-verification.repository.js';
import { EmailVerificationService } from './email-verification/email-verification.service.js';
import { PasswordResetRepository } from './password-reset/password-reset.repository.js';
import { PasswordResetService } from './password-reset/password-reset.service.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [AuthController, PasswordResetController, EmailVerificationController],
  providers: [
    AuthService,
    LoginAttempts,
    AuthRepository,
    PasswordResetService,
    PasswordResetRepository,
    EmailVerificationService,
    EmailVerificationRepository,
    IamService,
    OrgAccessProvider,
    {
      provide: ORG_ACCESS,
      useExisting: OrgAccessProvider,
    },
  ],
  exports: [ORG_ACCESS],
})
export class AuthModule {}
