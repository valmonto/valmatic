import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from '../config';
import { SeedModule } from './seed.module';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Self-contained module for the seed CLI. Stands up only the infrastructure
 * seeding needs (config, database, logger) so it can boot via
 * `NestFactory.createApplicationContext` without the full HTTP application.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        transport: isProduction
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: false, ignore: 'pid,hostname' } },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.getOrThrow<string>('DATABASE_URL'),
        maxConnections: config.get<number>('DATABASE_MAX_CONNECTIONS', 10),
      }),
    }),
    SeedModule,
  ],
})
export class SeedCliModule {}
