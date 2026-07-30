import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger, withFrameworkLogFilter } from '@pkg/server';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { IAM_REDIS } from '@pkg/server';
import type Redis from 'ioredis';
import { rateLimitErrorResponse, rateLimitKey, rateLimitMax } from './config/rate-limit';

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

  // Rate limiting — Redis-backed so limits hold across replicas and restarts.
  // Policy lives in config/rate-limit.ts (unit-tested): strict per-IP buckets
  // on login/register, a generous general limit keyed by IP + session
  // elsewhere. Off under test so suites never fight it.
  if (config.get<string>('NODE_ENV') !== 'test') {
    const rateLimitEnv = {
      max: config.get<number>('RATE_LIMIT_MAX', 300),
      authMax: config.get<number>('RATE_LIMIT_AUTH_MAX', 10),
      windowMs: config.get<number>('RATE_LIMIT_WINDOW_MS', 60_000),
    };

    await app.register(fastifyRateLimit, {
      global: true,
      redis: app.get<Redis>(IAM_REDIS),
      nameSpace: 'rate-limit:',
      timeWindow: rateLimitEnv.windowMs,
      max: (req) => rateLimitMax(rateLimitEnv, { ip: req.ip, url: req.url }),
      keyGenerator: (req) =>
        rateLimitKey({
          ip: req.ip,
          url: req.url,
          cookies: req.cookies as Record<string, string | undefined>,
          authorizationHeader: req.headers.authorization,
        }),
      allowList: (req) => req.url.split('?')[0] === '/health',
      errorResponseBuilder: () => rateLimitErrorResponse(),
    });
  }

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
