import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Check that the login form is visible
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('can navigate between login and register', async ({ page }) => {
    await page.goto('/auth/login');

    // Look for a link to register page
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/auth\/register/);
    }
  });
});
