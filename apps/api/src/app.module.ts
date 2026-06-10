import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import {
  EventsModule,
  GlobalExceptionFilter,
  HealthModule,
  LoggerErrorInterceptor,
  LoggingModule,
} from '@pkg/server';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrgModule } from './org/org.module';
import { JobsModule } from './jobs';
import { NotificationModule } from './notifications';
import { I18nModule } from './i18n';
import { SeedModule } from './seed/seed.module';
import { validateEnv } from './config';

@Module({
  imports: [
    LoggingModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.getOrThrow<string>('DATABASE_URL'),
        maxConnections: config.get<number>('DATABASE_MAX_CONNECTIONS', 10),
      }),
    }),
    EventsModule,
    I18nModule,
    HealthModule,
    AuthModule,
    UserModule,
    OrgModule,
    JobsModule,
    NotificationModule,
    SeedModule.forApp(),
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
  ],
})
export class AppModule {}
