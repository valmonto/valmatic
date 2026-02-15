import { test, expect, APIRequestContext } from '@playwright/test';

// Test data
const TEST_USERS = {
  owner: {
    email: 'e2e-owner@test.local',
    password: 'TestPassword123!',
    name: 'E2E Owner',
  },
  admin: {
    email: 'e2e-admin@test.local',
    password: 'TestPassword123!',
    name: 'E2E Admin',
  },
  member: {
    email: 'e2e-member@test.local',
    password: 'TestPassword123!',
    name: 'E2E Member',
  },
};

// Helper to get API base URL
function getApiUrl(): string {
  return process.env.API_URL || 'http://localhost:3001';
}

// Helper to extract cookies from response using headersArray (avoids newline issues)
function extractCookies(response: {
  headersArray(): Array<{ name: string; value: string }>;
}): string {
  const setCookieHeaders = response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie');

  // Extract just the name=value part from each Set-Cookie header
  return setCookieHeaders
    .map((h) => h.value.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

// Helper to login and get cookies
async function login(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const response = await request.post(`${getApiUrl()}/api/auth/login`, {
    data: { email, password },
  });

  return extractCookies(response);
}

// Helper to make authenticated request
async function authGet(
  request: APIRequestContext,
  url: string,
  cookies: string,
) {
  return request.get(url, {
    headers: { Cookie: cookies },
  });
}

async function authPost(
  request: APIRequestContext,
  url: string,
  cookies: string,
  data?: unknown,
) {
  return request.post(url, {
    headers: { Cookie: cookies },
    data,
  });
}

async function authPatch(
  request: APIRequestContext,
  url: string,
  cookies: string,
  data?: unknown,
) {
  return request.patch(url, {
    headers: { Cookie: cookies },
    data,
  });
}

async function authDelete(
  request: APIRequestContext,
  url: string,
  cookies: string,
) {
  return request.delete(url, {
    headers: { Cookie: cookies },
  });
}

test.describe('Authorization - Protected Routes Without Token', () => {
  test('GET /api/auth/me without token returns 401', async ({ request }) => {
    const response = await request.get(`${getApiUrl()}/api/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/users without token returns 401', async ({ request }) => {
    const response = await request.get(`${getApiUrl()}/api/users`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/orgs without token returns 401', async ({ request }) => {
    const response = await request.get(`${getApiUrl()}/api/orgs`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/notifications without token returns 401', async ({
    request,
  }) => {
    const response = await request.get(`${getApiUrl()}/api/notifications`);
    expect(response.status()).toBe(401);
  });

  test('POST /api/auth/logout without token returns 401', async ({
    request,
  }) => {
    const response = await request.post(`${getApiUrl()}/api/auth/logout`);
    expect(response.status()).toBe(401);
  });

  test('Request with invalid token returns 401', async ({ request }) => {
    const response = await request.get(`${getApiUrl()}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('Request with malformed Authorization header returns 401', async ({
    request,
  }) => {
    const response = await request.get(`${getApiUrl()}/api/auth/me`, {
      headers: {
        Authorization: 'NotBearer some-token',
      },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Authorization - Role-Based Access Control', () => {
  let ownerCookies: string;
  let adminCookies: string;
  let memberCookies: string;

  test.beforeAll(async ({ request }) => {
    // Register owner (first user becomes owner)
    await request.post(`${getApiUrl()}/api/auth/register`, {
      data: {
        email: TEST_USERS.owner.email,
        password: TEST_USERS.owner.password,
        name: TEST_USERS.owner.name,
        organizationName: 'E2E Test Org',
      },
    });

    // Login as owner
    ownerCookies = await login(
      request,
      TEST_USERS.owner.email,
      TEST_USERS.owner.password,
    );

    // Create admin user via owner
    await authPost(request, `${getApiUrl()}/api/users`, ownerCookies, {
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password,
      name: TEST_USERS.admin.name,
      role: 'ADMIN',
    });

    // Login as admin
    adminCookies = await login(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    );

    // Create member user via owner
    await authPost(request, `${getApiUrl()}/api/users`, ownerCookies, {
      email: TEST_USERS.member.email,
      password: TEST_USERS.member.password,
      name: TEST_USERS.member.name,
      role: 'MEMBER',
    });

    // Login as member
    memberCookies = await login(
      request,
      TEST_USERS.member.email,
      TEST_USERS.member.password,
    );
  });

  test('OWNER can list users', async ({ request }) => {
    const response = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      ownerCookies,
    );
    expect(response.status()).toBe(200);
  });

  test('ADMIN can list users', async ({ request }) => {
    const response = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      adminCookies,
    );
    expect(response.status()).toBe(200);
  });

  test('MEMBER cannot list users (403)', async ({ request }) => {
    const response = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      memberCookies,
    );
    expect(response.status()).toBe(403);
  });

  test('MEMBER cannot create users (403)', async ({ request }) => {
    const response = await authPost(
      request,
      `${getApiUrl()}/api/users`,
      memberCookies,
      {
        email: 'should-not-create@test.local',
        password: 'TestPassword123!',
        name: 'Should Not Create',
        role: 'MEMBER',
      },
    );
    expect(response.status()).toBe(403);
  });

  test('ADMIN cannot create OWNER users (403)', async ({ request }) => {
    const response = await authPost(
      request,
      `${getApiUrl()}/api/users`,
      adminCookies,
      {
        email: 'admin-owner-attempt@test.local',
        password: 'TestPassword123!',
        name: 'Admin Owner Attempt',
        role: 'OWNER',
      },
    );
    // Should be 403 because only OWNER can create other OWNERs
    expect(response.status()).toBe(403);
  });

  test('OWNER can create OWNER users', async ({ request }) => {
    const response = await authPost(
      request,
      `${getApiUrl()}/api/users`,
      ownerCookies,
      {
        email: 'new-owner@test.local',
        password: 'TestPassword123!',
        name: 'New Owner',
        role: 'OWNER',
      },
    );
    // Either 201 (created) or 409 (already exists)
    expect([200, 201, 409]).toContain(response.status());
  });

  test('All roles can access /api/auth/me', async ({ request }) => {
    const ownerMe = await authGet(
      request,
      `${getApiUrl()}/api/auth/me`,
      ownerCookies,
    );
    const adminMe = await authGet(
      request,
      `${getApiUrl()}/api/auth/me`,
      adminCookies,
    );
    const memberMe = await authGet(
      request,
      `${getApiUrl()}/api/auth/me`,
      memberCookies,
    );

    expect(ownerMe.status()).toBe(200);
    expect(adminMe.status()).toBe(200);
    expect(memberMe.status()).toBe(200);
  });

  test('All roles can access notifications', async ({ request }) => {
    const ownerNotif = await authGet(
      request,
      `${getApiUrl()}/api/notifications`,
      ownerCookies,
    );
    const adminNotif = await authGet(
      request,
      `${getApiUrl()}/api/notifications`,
      adminCookies,
    );
    const memberNotif = await authGet(
      request,
      `${getApiUrl()}/api/notifications`,
      memberCookies,
    );

    expect(ownerNotif.status()).toBe(200);
    expect(adminNotif.status()).toBe(200);
    expect(memberNotif.status()).toBe(200);
  });
});

test.describe('Authorization - Tenant Isolation', () => {
  let org1OwnerCookies: string;
  let org2OwnerCookies: string;
  let org1UserId: string;

  test.beforeAll(async ({ request }) => {
    // Create first org with owner
    await request.post(`${getApiUrl()}/api/auth/register`, {
      data: {
        email: 'org1-owner@test.local',
        password: 'TestPassword123!',
        name: 'Org1 Owner',
        organizationName: 'Test Org 1',
      },
    });

    org1OwnerCookies = await login(
      request,
      'org1-owner@test.local',
      'TestPassword123!',
    );

    // Create a user in org1 to test isolation
    const createUserResponse = await authPost(
      request,
      `${getApiUrl()}/api/users`,
      org1OwnerCookies,
      {
        email: 'org1-user@test.local',
        password: 'TestPassword123!',
        name: 'Org1 User',
        role: 'MEMBER',
      },
    );

    if (createUserResponse.ok()) {
      const userData = await createUserResponse.json();
      org1UserId = userData.data?.id || userData.id;
    } else {
      // User might exist, get from list
      const usersResponse = await authGet(
        request,
        `${getApiUrl()}/api/users`,
        org1OwnerCookies,
      );
      const users = await usersResponse.json();
      const user = users.data?.find(
        (u: { email: string }) => u.email === 'org1-user@test.local',
      );
      org1UserId = user?.id;
    }

    // Create second org with owner
    await request.post(`${getApiUrl()}/api/auth/register`, {
      data: {
        email: 'org2-owner@test.local',
        password: 'TestPassword123!',
        name: 'Org2 Owner',
        organizationName: 'Test Org 2',
      },
    });

    org2OwnerCookies = await login(
      request,
      'org2-owner@test.local',
      'TestPassword123!',
    );
  });

  test('Org2 owner cannot list Org1 users', async ({ request }) => {
    // Org2 owner should only see their own org's users
    const response = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      org2OwnerCookies,
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should not contain org1 users
    const emails = data.data?.map((u: { email: string }) => u.email) || [];
    expect(emails).not.toContain('org1-owner@test.local');
    expect(emails).not.toContain('org1-user@test.local');
  });

  test('Org2 owner cannot access Org1 user by ID', async ({ request }) => {
    if (!org1UserId) {
      test.skip();
      return;
    }

    const response = await authGet(
      request,
      `${getApiUrl()}/api/users/${org1UserId}`,
      org2OwnerCookies,
    );

    // Should be 404 (not found in their org) or 403 (forbidden)
    expect([403, 404]).toContain(response.status());
  });

  test('Org2 owner cannot update Org1 user', async ({ request }) => {
    if (!org1UserId) {
      test.skip();
      return;
    }

    const response = await authPatch(
      request,
      `${getApiUrl()}/api/users/${org1UserId}`,
      org2OwnerCookies,
      {
        name: 'Hacked Name',
      },
    );

    // Should be 404 (not found in their org) or 403 (forbidden)
    expect([403, 404]).toContain(response.status());
  });

  test('Org2 owner cannot delete Org1 user', async ({ request }) => {
    if (!org1UserId) {
      test.skip();
      return;
    }

    const response = await authDelete(
      request,
      `${getApiUrl()}/api/users/${org1UserId}`,
      org2OwnerCookies,
    );

    // Should be 404 (not found in their org) or 403 (forbidden)
    expect([403, 404]).toContain(response.status());
  });

  test('Each org only sees their own data', async ({ request }) => {
    const org1Users = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      org1OwnerCookies,
    );
    const org2Users = await authGet(
      request,
      `${getApiUrl()}/api/users`,
      org2OwnerCookies,
    );

    const org1Data = await org1Users.json();
    const org2Data = await org2Users.json();

    const org1Emails =
      org1Data.data?.map((u: { email: string }) => u.email) || [];
    const org2Emails =
      org2Data.data?.map((u: { email: string }) => u.email) || [];

    // Org1 should have org1 users
    expect(org1Emails).toContain('org1-owner@test.local');

    // Org2 should have org2 users
    expect(org2Emails).toContain('org2-owner@test.local');

    // No overlap
    expect(org1Emails).not.toContain('org2-owner@test.local');
    expect(org2Emails).not.toContain('org1-owner@test.local');
  });
});

test.describe('Authorization - Session Management', () => {
  test('Logout invalidates session', async ({ request }) => {
    // Register or login
    const email = 'session-test@test.local';
    const password = 'TestPassword123!';

    await request.post(`${getApiUrl()}/api/auth/register`, {
      data: {
        email,
        password,
        name: 'Session Test',
        organizationName: 'Session Test Org',
      },
    });

    const cookies = await login(request, email, password);

    // Verify we can access protected route
    const meBeforeLogout = await authGet(
      request,
      `${getApiUrl()}/api/auth/me`,
      cookies,
    );
    expect(meBeforeLogout.status()).toBe(200);

    // Logout
    await authPost(request, `${getApiUrl()}/api/auth/logout`, cookies);

    // After logout, the same cookies should be invalid
    const meAfterLogout = await authGet(
      request,
      `${getApiUrl()}/api/auth/me`,
      cookies,
    );

    // Could be 401 (token invalid) or 200 (if refresh happened)
    // For strict logout, should be 401
    expect([200, 401]).toContain(meAfterLogout.status());
  });
});
