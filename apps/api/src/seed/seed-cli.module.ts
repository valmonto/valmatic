import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@pkg/database';
import { LoggingModule } from '@pkg/server';
import { validateEnv } from '../config';
import { SeedModule } from './seed.module';

/**
 * Self-contained module for the seed CLI. Stands up only the infrastructure
 * seeding needs (config, database, logger) so it can boot via
 * `NestFactory.createApplicationContext` without the full HTTP application.
 */
@Module({
  imports: [
    LoggingModule.forRoot(),
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
