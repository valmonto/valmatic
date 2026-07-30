import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import {
  EventsModule,
  HealthModule,
  LoggerErrorInterceptor,
  LoggingModule,
  RedisModule,
  TelemetryModule,
} from '@pkg/server';
import { WorkerQueuesModule } from './queues';
import { validateEnv } from './config';

@Module({
  imports: [
    LoggingModule.forRoot({ singleLine: true }),
    TelemetryModule,
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
    // Redis is the worker's only input — jobs arrive through it. Registering the
    // client here is what lets /health probe it: without it the check silently
    // skips Redis and a worker that cannot reach the queue reports healthy while
    // processing nothing.
    RedisModule,
    WorkerQueuesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor }],
})
export class AppModule {}
