import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (req, reply, payload, done) => {
      reply.removeHeader('X-Powered-By');
      reply.header('X-Content-Type-Options', 'nosniff');
      done();
    });

  const config = app.get(ConfigService);

  await app.register(fastifyCookie, {
    secret: config.getOrThrow<string>('IAM_COOKIE_SECRET'),
    parseOptions: {},
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  // Log startup
  logger.log(`API server listening on port ${port}`);
}

void bootstrap();
