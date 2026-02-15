import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerErrorInterceptor, LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { DatabaseModule } from '@pkg/database';
import { EventsModule, HealthModule } from '@pkg/server';
import { WorkerQueuesModule } from './queues';
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
                singleLine: true,
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
        maxConnections: config.get<number>('DATABASE_MAX_CONNECTIONS', 5),
      }),
    }),
    EventsModule,
    WorkerQueuesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor }],
})
export class AppModule {}
