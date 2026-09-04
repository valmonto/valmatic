import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { IamModule, IamService, ORG_ACCESS } from '@pkg/server';
import { AuthRepository } from './auth.repository.js';
import { OrgAccessProvider } from './org-access.provider.js';

@Global()
@Module({
  imports: [IamModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
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
