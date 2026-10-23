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
import { AuthProviderController } from './provider/auth-provider.controller.js';
import { AuthProviderRepository } from './provider/auth-provider.repository.js';
import { AuthProviderService } from './provider/auth-provider.service.js';
import { IdentityTokenVerifier } from './provider/identity-token.verifier.js';
import { ProviderTokens } from './provider/provider-tokens.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [
    AuthController,
    PasswordResetController,
    EmailVerificationController,
    AuthProviderController,
  ],
  providers: [
    AuthService,
    LoginAttempts,
    AuthRepository,
    PasswordResetService,
    PasswordResetRepository,
    EmailVerificationService,
    EmailVerificationRepository,
    AuthProviderService,
    AuthProviderRepository,
    IdentityTokenVerifier,
    ProviderTokens,
    IamService,
    OrgAccessProvider,
    {
      provide: ORG_ACCESS,
      useExisting: OrgAccessProvider,
    },
  ],
  // AuthProviderService: deleting an account confirms it with a provider too.
  exports: [ORG_ACCESS, AuthProviderService],
})
export class AuthModule {}
