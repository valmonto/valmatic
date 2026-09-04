import { Global, Module } from '@nestjs/common';
import { AUTH_PROVIDER } from './auth-provider.js';
import { APP_GUARD } from '@nestjs/core';
import { ActiveOrgGuard } from './guards/active-org.guard.js';
import { AuthGuard } from './guards/auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SystemRolesGuard } from './guards/system-roles.guard.js';
import { ConfigService } from '@nestjs/config';
import { LocalAuthProvider } from './local/local-auth.provider.js';
import { LocalAuthGuard } from './local/local-auth.guard.js';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('IAM_JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    LocalAuthProvider,
    {
      provide: AUTH_PROVIDER,
      useExisting: LocalAuthProvider,
    },
    LocalAuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // ActiveOrgGuard runs AFTER AuthGuard — it compares the organization named
    // in the path against the one on the token, so it needs req.user — and
    // BEFORE the role guards, so they judge the organization actually addressed.
    {
      provide: APP_GUARD,
      useClass: ActiveOrgGuard,
    },
    // RolesGuard runs AFTER AuthGuard (order matters)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // PermissionsGuard runs AFTER RolesGuard for fine-grained access control
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // SystemRolesGuard is last: it judges the platform axis, which is
    // independent of the organization the guards above have been checking.
    {
      provide: APP_GUARD,
      useClass: SystemRolesGuard,
    },
  ],
  controllers: [],
  exports: [AUTH_PROVIDER, LocalAuthProvider],
})
export class AuthProviderModule {}
