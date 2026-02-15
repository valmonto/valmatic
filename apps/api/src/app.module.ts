import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import { LoggerErrorInterceptor, LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventsModule, GlobalExceptionFilter, HealthModule } from '@pkg/server';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrgModule } from './org/org.module';
import { JobsModule } from './jobs';
import { NotificationModule } from './notifications';
import { I18nModule } from './i18n';
import { validateEnv } from './config';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule.forRoot({
      assignResponse: true,
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: false,
                ignore: 'pid,hostname',
              },
            },
        genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
        serializers: {
          req(req: IncomingMessage & { id?: string; raw?: { url?: string; method?: string } }) {
            return {
              id: req.id,
              method: req.method ?? req.raw?.method,
              url: req.url ?? req.raw?.url,
              headers: {
                host: req.headers?.['host'],
                'content-type': req.headers?.['content-type'],
                'user-agent': req.headers?.['user-agent'],
              },
            };
          },
          res(res: ServerResponse & { statusCode?: number }) {
            return {
              statusCode: res.statusCode,
              headers: {
                'content-type': res.getHeader?.('content-type'),
                'content-length': res.getHeader?.('content-length'),
              },
            };
          },
        },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["set-cookie"]'],
          censor: '[REDACTED]',
        },
      },
    }),
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
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
  ],
})
export class AppModule {}
