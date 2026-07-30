import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger, withFrameworkLogFilter } from '@pkg/server';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';

async function bootstrap(): Promise<void> {
  // trustProxy must exist before the app does, so it reads the raw env (the
  // same variable the schema validates). Behind a reverse proxy the client IP
  // arrives in X-Forwarded-For; without this, rate limiting sees every request
  // as the proxy and throttles all users as one.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: process.env.TRUST_PROXY === 'true' }),
    {
      bufferLogs: true,
    },
  );

  const logger = app.get(Logger);
  app.useLogger(withFrameworkLogFilter(logger));

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (req, reply, payload, done) => {
      reply.removeHeader('X-Powered-By');
      done();
    });

  const config = app.get(ConfigService);

  // Security headers. CSP is off — this is a JSON API, and a policy written
  // for pages it never serves only causes mystery breakage. CORP is
  // cross-origin because the SPA legitimately consumes these responses from
  // another origin; actual access control is CORS below, not this header.
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  // Log startup
  logger.log(`API server listening on port ${port}`);
}

void bootstrap();
