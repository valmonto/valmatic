import { Global, Module } from '@nestjs/common';
import { AUTH_PROVIDER } from './auth-provider';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ConfigService } from '@nestjs/config';
import { LocalAuthProvider } from './local/local-auth.provider';
import { LocalAuthGuard } from './local/local-auth.guard';
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
    // RolesGuard runs AFTER AuthGuard (order matters)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [],
  exports: [AUTH_PROVIDER, LocalAuthProvider],
})
export class AuthProviderModule {}
