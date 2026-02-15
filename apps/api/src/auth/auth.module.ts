import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IamModule, IamService, ORG_ACCESS } from '@pkg/server';
import { AuthRepository } from './auth.repository';
import { OrgAccessProvider } from './org-access.provider';

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
