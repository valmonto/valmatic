import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import { EventsModule, HealthModule, LoggerErrorInterceptor, LoggingModule } from '@pkg/server';
import { WorkerQueuesModule } from './queues';
import { validateEnv } from './config';

@Module({
  imports: [
    LoggingModule.forRoot({ singleLine: true }),
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
