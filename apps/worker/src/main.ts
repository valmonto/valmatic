import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('WORKER_PORT', 3001);
  await app.listen(port, '0.0.0.0');

  // Log startup
  logger.log(`Worker server listening on port ${port}`);
}

void bootstrap();
