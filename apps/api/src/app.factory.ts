import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger, withFrameworkLogFilter } from '@pkg/server';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';

import { AppModule } from './app.module.js';

/**
 * Builds the api exactly as production runs it — adapter, security headers,
 * signed cookies, CORS, the global prefix — without listening.
 *
 * `main.ts` calls this and listens. The in-process pipeline suite
 * (`__tests__/pipeline`) calls this and uses `app.inject()`, so every guard,
 * filter and plugin registration below is exercised by `pnpm verify` rather
 * than only by a deployed container. (A careless edit once sliced the cookie
 * and CORS registrations out of `main.ts`; nothing in verify booted it, so
 * only production could reveal the missing plugin — and did.)
 */
export async function createApp(): Promise<NestFastifyApplication> {
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

  // Signed auth cookies — without this registration reply.setCookie does not
  // exist and every login 500s.
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
      : [
          /^http:\/\/localhost:\d+$/,
          /^http:\/\/127\.0\.0\.1:\d+$/,
          /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  return app;
}
