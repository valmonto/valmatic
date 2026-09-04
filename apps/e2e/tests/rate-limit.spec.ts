import { test, expect } from '@playwright/test';

/**
 * Rate limiting against the REAL stack: NODE_ENV=production in compose.e2e.yml,
 * so the throttler is live, Redis-backed, keyed by the verified user.
 *
 * A dedicated user gives this spec its own bucket — the login/register limits
 * are per IP and shared with every other spec in the run, so they are not a
 * safe thing to exhaust here. The global default budget (RATE_LIMIT_MAX,
 * default 300 per minute) is per user and is what this spec walks into.
 */

const API = process.env.API_URL || 'http://localhost:3001';
const BUDGET = Number(process.env.RATE_LIMIT_MAX ?? 300);

test.describe('Rate limiting', () => {
  test('an authenticated caller is cut off at the global budget with a 429 body', async ({
    request,
  }) => {
    const email = `ratelimit-${Date.now().toString(36)}@test.local`;
    const password = 'TestPassword123!';

    const reg = await request.post(`${API}/api/auth/register`, {
      headers: { 'x-client': 'mobile' },
      data: { email, password, name: 'Rate Limit', organizationName: 'Rate Limit Org' },
    });
    expect(reg.status(), await reg.text()).toBe(201);
    const { tokens } = (await reg.json()) as { tokens: { accessToken: string } };
    const headers = { authorization: `Bearer ${tokens.accessToken}` };

    let firstBlocked = -1;
    let blockedBody: unknown;
    for (let i = 0; i < BUDGET + 5; i++) {
      const res = await request.get(`${API}/api/auth/me`, { headers });
      if (res.status() === 429) {
        firstBlocked = i;
        blockedBody = await res.json();
        break;
      }
      expect(res.status(), `request ${i}`).toBe(200);
    }

    // The budget is exact: N allowed, the N+1th refused.
    expect(firstBlocked).toBe(BUDGET);
    expect(blockedBody).toMatchObject({
      statusCode: 429,
      message: 'auth.errors.tooManyRequests',
      error: 'Too Many Requests',
    });
  });

  test('/health is never throttled', async ({ request }) => {
    for (let i = 0; i < 10; i++) {
      expect((await request.get(`${API}/health`)).status()).toBe(200);
    }
  });
});
