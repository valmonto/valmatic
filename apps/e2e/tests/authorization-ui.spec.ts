import { test, expect } from '@playwright/test';

test.describe('Authorization UI - Unauthenticated Access', () => {
  test('accessing protected route redirects to login', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('accessing /users redirects to login', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('accessing /settings redirects to login', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('accessing /notifications redirects to login', async ({ page }) => {
    await page.goto('/notifications');

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Authorization UI - Login Flow', () => {
  const testEmail = 'ui-auth-test@test.local';
  const testPassword = 'TestPassword123!';

  test.beforeAll(async ({ request }) => {
    // Register test user via API (ignore if already exists)
    // Use the web URL so it goes through nginx, same as browser
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'UI AuthTest',
        organizationName: 'UI Auth Test Org',
      },
    });
    // We don't check the response - if user already exists, that's fine
    // The actual login test will verify credentials work
  });

  test('successful login grants access to protected routes', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to home page (login uses window.location.href = '/')
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('nonexistent@test.local');
    await page.getByLabel(/password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /sign in|login|submit/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/);

    // Should show some kind of error message
    await expect(
      page.getByText(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      ),
    ).toBeVisible();
  });
});

test.describe('Authorization UI - Role-Based UI Elements', () => {
  test.describe('As MEMBER', () => {
    test.beforeEach(async () => {
      // This test requires a MEMBER user to exist
      // Setup would be done via API in real scenario
      test.skip(true, 'Requires seeded MEMBER user - implement with test fixtures');
    });

    test('MEMBER should not see user management link', async ({ page }) => {
      // Members shouldn't have access to user management
      const usersLink = page.getByRole('link', { name: /users/i });
      await expect(usersLink).not.toBeVisible();
    });
  });

  test.describe('As ADMIN/OWNER', () => {
    test.beforeEach(async () => {
      test.skip(true, 'Requires seeded ADMIN/OWNER user - implement with test fixtures');
    });

    test('ADMIN/OWNER should see user management link', async ({ page }) => {
      const usersLink = page.getByRole('link', { name: /users/i });
      await expect(usersLink).toBeVisible();
    });
  });
});
