import type { NestNodeApplication } from '@nestjs/platform-node';

import { NestFactory } from '@nestjs/core';
import { NodeAdapter } from '@nestjs/platform-node';
import { ConfigService } from '@nestjs/config';
import { Logger, withFrameworkLogFilter } from '@pkg/server';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(withFrameworkLogFilter(logger));

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('WORKER_PORT', 3001);
  await app.listen(port, '0.0.0.0');

  // Log startup
  logger.log(`Worker server listening on port ${port}`);
}

void bootstrap();
