import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginAttempts } from './login-attempts.js';
import { IamModule, IamService, ORG_ACCESS } from '@pkg/server';
import { AuthRepository } from './auth.repository.js';
import { OrgAccessProvider } from './org-access.provider.js';
import { PasswordResetController } from './password-reset/password-reset.controller.js';
import { PasswordResetRepository } from './password-reset/password-reset.repository.js';
import { PasswordResetService } from './password-reset/password-reset.service.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [AuthController, PasswordResetController],
  providers: [
    AuthService,
    LoginAttempts,
    AuthRepository,
    PasswordResetService,
    PasswordResetRepository,
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
