import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger, withFrameworkLogFilter } from '@pkg/server';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(withFrameworkLogFilter(logger));

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

  // CORS — browsers (e.g. the Expo web build at localhost:8081, or any SPA on a
  // different origin) send a preflight that must be allowed. Native apps don't
  // enforce CORS, so this only matters for web clients. Set CORS_ORIGINS to a
  // comma-separated allowlist in production; in dev we reflect localhost/LAN.
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins.split(',').map((o) => o.trim())
      : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/192\.168\.\d+\.\d+:\d+$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  // Log startup
  logger.log(`API server listening on port ${port}`);
}

void bootstrap();
