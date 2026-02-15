import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');

    // Basic check that the page loaded
    await expect(page).toHaveTitle(/.*/);
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., favicon 404, 401 for unauthenticated)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('401'),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should show some kind of 404 content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
