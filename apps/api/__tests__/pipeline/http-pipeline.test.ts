import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createDatabaseClient, type DatabaseClient } from '@pkg/database';
import { describeStack } from '@pkg/testing';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

/**
 * The request pipeline, booted the way production boots it and driven over
 * HTTP in-process — no listener, no browser, no mocks of Nest.
 *
 * Everything else in this workspace tests OUR code with Nest's collaborators
 * replaced: guards get a hand-built ExecutionContext, services get fake
 * repositories. Those suites cannot tell whether the framework still calls a
 * guard, still routes the global prefix, still hands the exception filter
 * the same request, or still lets a plugin register. This one can, which is
 * what makes it the before/after baseline for any framework upgrade.
 *
 * Runs when DATABASE_URL and IAM_REDIS_HOST are set (CI provides both).
 */

const SECRET = 'pipeline-suite-secret-that-is-at-least-32-chars';
const RUN = Date.now().toString(36);
const PASSWORD = 'PipelinePass123!';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/** Truncate every application table, leaving the migrations ledger alone. */
async function resetDatabase(client: DatabaseClient): Promise<void> {
  const rows = await client.sql<{ tablename: string }[]>`
    select tablename from pg_tables where schemaname = 'public'
  `;
  const tables = rows.map((r) => `"${r.tablename}"`);
  if (tables.length > 0) {
    await client.sql.unsafe(`truncate table ${tables.join(', ')} cascade`);
  }
}

function withEnv(overrides: Record<string, string | undefined>): () => void {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

/** Boot a fresh app; env is read at module compile, so set it first. */
async function boot(env: Record<string, string | undefined>): Promise<{
  app: NestFastifyApplication;
  restoreEnv: () => void;
}> {
  const restoreEnv = withEnv({
    IAM_JWT_SECRET: SECRET,
    IAM_COOKIE_SECRET: SECRET,
    AUTH_REGISTRATION_ENABLED: 'true',
    // Queues and the IAM session store both need Redis — same instance here.
    REDIS_HOST: process.env.IAM_REDIS_HOST,
    REDIS_PORT: process.env.IAM_REDIS_PORT,
    REDIS_PASSWORD: process.env.IAM_REDIS_PASSWORD,
    ...env,
  });
  // ConfigModule.forRoot() validates env when app.module.ts is first evaluated,
  // so each boot needs a fresh module graph or the second app inherits the
  // first one's config. Imported lazily, after the env above is in place.
  vi.resetModules();
  const { createApp } = await import('@/app.factory.js');
  const app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, restoreEnv };
}

async function register(
  app: NestFastifyApplication,
  who: string,
): Promise<{ token: string; email: string }> {
  const email = `${who}-${RUN}@pipeline.test`;
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers: { 'x-client': 'mobile' },
    payload: { email, password: PASSWORD, name: who, organizationName: `${who} org` },
  });
  expect(res.statusCode, res.body).toBe(201);
  const body = res.json<{ tokens: { accessToken: string } }>();
  return { token: body.tokens.accessToken, email };
}

async function login(app: NestFastifyApplication, email: string, password = PASSWORD) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'x-client': 'mobile' },
    payload: { email, password },
  });
}

const bearer = (token: string): Record<string, string> => ({ authorization: `Bearer ${token}` });

describeStack('HTTP pipeline (in-process, NODE_ENV=test)', () => {
  const client = createDatabaseClient({ url: process.env.DATABASE_URL! });
  let app: NestFastifyApplication;
  let restoreEnv: () => void;

  beforeAll(async () => {
    await resetDatabase(client);
    ({ app, restoreEnv } = await boot({ NODE_ENV: 'test' }));
  });

  afterAll(async () => {
    await app?.close();
    restoreEnv?.();
    await client.close();
  });

  it('serves /health outside the global prefix, unauthenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
    expect(res.json<{ uptime: number }>().uptime).toBeGreaterThanOrEqual(0);
    // Prefixed routes do not exist under the bare path…
    expect((await app.inject({ method: 'GET', url: '/auth/me' })).statusCode).toBe(404);
    // …and /health is not duplicated under the prefix.
    expect((await app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(404);
  });

  it("answers an unauthenticated request with the exception filter body, not Fastify's", async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });

    expect(res.statusCode).toBe(401);
    const body = res.json<ErrorBody>();
    expect(body).toMatchObject({ statusCode: 401, error: 'Unauthorized', path: '/api/auth/me' });
    expect(typeof body.message).toBe('string');
    expect(Date.parse(body.timestamp)).not.toBeNaN();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('routes an unknown path under the prefix through the filter as 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/definitely-not-a-route' });

    expect(res.statusCode).toBe(404);
    expect(res.json<ErrorBody>()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/api/definitely-not-a-route',
    });
  });

  it('rejects an invalid payload with a 400 from the filter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'x' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<ErrorBody>();
    expect(body).toMatchObject({ statusCode: 400, path: '/api/auth/register' });
    expect(body.message).toBeDefined();
    expect(body.error).toBeDefined();
  });

  it('registers, authenticates with a bearer token, and identifies the caller from the session', async () => {
    const { token, email } = await register(app, 'owner-a');

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: bearer(token) });

    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email, orgRole: 'OWNER' });
  });

  it('sets signed httpOnly cookies for web clients and accepts them back', async () => {
    const email = `web-${RUN}@pipeline.test`;
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: PASSWORD, name: 'Web', organizationName: 'Web org' },
    });
    expect(reg.statusCode, reg.body).toBe(201);

    const cookies = reg.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    expect(reg.cookies.map((c) => c.name)).toEqual(
      expect.arrayContaining(['accessToken', 'refreshToken']),
    );

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookies },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email });
  });

  it('keeps an org-scoped read inside the tenant: another org gets 404, never the row', async () => {
    const a = await register(app, 'tenant-a');
    const b = await register(app, 'tenant-b');

    const created = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: bearer(a.token),
      payload: {
        email: `member-a-${RUN}@pipeline.test`,
        password: PASSWORD,
        name: 'Member A',
        role: 'MEMBER',
      },
    });
    expect(created.statusCode, created.body).toBe(201);
    const memberId = created.json<{ id: string }>().id;

    const ownRead = await app.inject({
      method: 'GET',
      url: `/api/users/${memberId}`,
      headers: bearer(a.token),
    });
    expect(ownRead.statusCode).toBe(200);

    const crossRead = await app.inject({
      method: 'GET',
      url: `/api/users/${memberId}`,
      headers: bearer(b.token),
    });
    expect(crossRead.statusCode).toBe(404);
    // The body names the path (which carries the id) but never the row.
    expect(crossRead.body).not.toContain('Member A');
    expect(crossRead.body).not.toContain(`member-a-${RUN}`);

    const crossList = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: bearer(b.token),
    });
    expect(crossList.statusCode).toBe(200);
    expect(crossList.body).not.toContain(`member-a-${RUN}`);
  });

  it('lets the permissions guard deny a MEMBER with the translated 403 body', async () => {
    const owner = await register(app, 'perm-owner');
    const memberEmail = `perm-member-${RUN}@pipeline.test`;
    const created = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: bearer(owner.token),
      payload: { email: memberEmail, password: PASSWORD, name: 'Member', role: 'MEMBER' },
    });
    expect(created.statusCode, created.body).toBe(201);

    const memberLogin = await login(app, memberEmail);
    expect(memberLogin.statusCode, memberLogin.body).toBe(201);
    const memberToken = memberLogin.json<{ tokens: { accessToken: string } }>().tokens.accessToken;

    const denied = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: bearer(memberToken),
    });

    expect(denied.statusCode).toBe(403);
    expect(denied.json<ErrorBody>()).toMatchObject({
      statusCode: 403,
      message: 'auth.errors.insufficientPermissions',
      error: 'Forbidden',
      path: '/api/users',
    });
  });

  it('rejects a bad password with 401 and never leaks which half was wrong', async () => {
    const { email } = await register(app, 'badpw');
    const res = await login(app, email, 'WrongPassword123!');

    expect(res.statusCode).toBe(401);
    expect(res.json<ErrorBody>().statusCode).toBe(401);
  });
});

describeStack('HTTP pipeline (in-process, NODE_ENV=development: throttling + startup seed)', () => {
  const client = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const seedEmail = `seeded-owner-${RUN}@pipeline.test`;
  let app: NestFastifyApplication;
  let restoreEnv: () => void;

  beforeAll(async () => {
    await resetDatabase(client);
    ({ app, restoreEnv } = await boot({
      NODE_ENV: 'development',
      // A tiny global budget so the 429 is reachable in a handful of requests.
      RATE_LIMIT_MAX: '3',
      RATE_LIMIT_WINDOW_MS: '60000',
      // Seed on boot — proves the bootstrap hook runs once the database
      // provider is usable, which is the ordering the code relies on.
      SEED_ON_STARTUP: 'true',
      SEED_STRATEGY: 'production',
      SEED_INITIAL_EMAIL: seedEmail,
      SEED_INITIAL_PASSWORD: PASSWORD,
      SEED_INITIAL_NAME: 'Seeded Owner',
      SEED_INITIAL_ORG_NAME: 'Seeded Org',
    }));
  });

  afterAll(async () => {
    await app?.close();
    restoreEnv?.();
    await client.close();
  });

  it('ran the startup seeder after the database was usable: the seeded owner can log in', async () => {
    const res = await login(app, seedEmail);

    expect(res.statusCode, res.body).toBe(201);
    expect(res.json()).toMatchObject({ user: expect.objectContaining({ email: seedEmail }) });
  });

  it('throttles an authenticated caller past the global budget with the throttler body', async () => {
    // Fresh user → fresh bucket, so a re-run within the window cannot bleed in.
    const { token } = await register(app, 'throttled');

    const statuses: number[] = [];
    let last: ReturnType<NestFastifyApplication['inject']> extends Promise<infer R> ? R : never;
    for (let i = 0; i < 4; i++) {
      last = await app.inject({ method: 'GET', url: '/api/auth/me', headers: bearer(token) });
      statuses.push(last.statusCode);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(last!.json<ErrorBody>()).toMatchObject({
      statusCode: 429,
      message: 'auth.errors.tooManyRequests',
      error: 'Too Many Requests',
      path: '/api/auth/me',
    });
  });

  it('keys the budget by the verified user, so one user exhausting it leaves another untouched', async () => {
    // Carrier NAT: both users arrive from the same IP. If the guard ran
    // before the auth chain, req.user would be unset and both would share
    // one IP bucket — the exact failure the tracker exists to prevent.
    const a = await register(app, 'nat-a');
    const b = await register(app, 'nat-b');

    for (let i = 0; i < 3; i++) {
      expect(
        (await app.inject({ method: 'GET', url: '/api/auth/me', headers: bearer(a.token) }))
          .statusCode,
      ).toBe(200);
    }
    expect(
      (await app.inject({ method: 'GET', url: '/api/auth/me', headers: bearer(a.token) }))
        .statusCode,
    ).toBe(429);

    const other = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: bearer(b.token),
    });
    expect(other.statusCode).toBe(200);
  });

  it('never throttles /health, which orchestration probes hit on every tick', async () => {
    for (let i = 0; i < 6; i++) {
      expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
    }
  });
});
