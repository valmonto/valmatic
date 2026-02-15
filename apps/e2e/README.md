# E2E Tests (`@pkg/e2e`)

End-to-end tests for the vboilerplate platform using Playwright.

## Tech Stack

| Category  | Technology  |
| --------- | ----------- |
| Framework | Playwright  |
| Browser   | Chromium    |
| Reporting | HTML + List |

## Project Structure

```
apps/e2e/
├── playwright.config.ts    # Playwright configuration
├── tests/
│   ├── smoke.spec.ts       # Basic health checks
│   ├── auth.spec.ts        # Auth page navigation
│   ├── authorization.spec.ts      # API auth & RBAC tests
│   └── authorization-ui.spec.ts   # UI auth flow tests
└── test-results/
    ├── html/               # HTML report
    └── artifacts/          # Screenshots, videos, traces
```

## Test Suites

### Smoke Tests (`smoke.spec.ts`)

- Homepage loads
- No console errors
- 404 page works

### Auth Tests (`auth.spec.ts`)

- Login page loads
- Register page loads
- Navigation between auth pages

### Authorization API Tests (`authorization.spec.ts`)

- **Protected Routes** - 401 without token
- **Role-Based Access Control**
  - OWNER can list/create users
  - ADMIN can list users, cannot create OWNER
  - MEMBER cannot access user management
- **Tenant Isolation**
  - Org2 cannot see Org1 users
  - Org2 cannot access/update/delete Org1 resources
- **Session Management**
  - Logout invalidates session

### Authorization UI Tests (`authorization-ui.spec.ts`)

- Protected routes redirect to login
- Successful login grants access
- Invalid credentials show error
- Role-based UI elements (WIP)

## Running Tests

### From Root (Recommended)

```bash
# Run all e2e tests
pnpm e2e

# Run with UI mode (interactive)
pnpm e2e:ui

# Run headed (visible browser)
pnpm e2e:headed

# Run in debug mode
pnpm e2e:debug

# Run in Docker (CI-like)
pnpm e2e:docker
```

### From apps/e2e

```bash
# Run tests
pnpm test

# UI mode
pnpm test:ui

# Headed mode
pnpm test:headed

# Debug mode
pnpm test:debug

# View last report
pnpm report
```

## Configuration

### Environment Variables

| Variable   | Default                 | Description                              |
| ---------- | ----------------------- | ---------------------------------------- |
| `BASE_URL` | `http://localhost:5173` | Web app URL                              |
| `API_URL`  | `http://localhost:3001` | API URL (for direct API tests)           |
| `CI`       | -                       | Enables CI mode (retries, single worker) |

### Projects

| Project           | Description                  |
| ----------------- | ---------------------------- |
| `chromium`        | Headless Chromium (default)  |
| `chromium-headed` | Visible browser with slow-mo |

### Test Artifacts

- **Traces:** Always captured (`trace: 'on'`)
- **Screenshots:** On failure only
- **Video:** Always recorded
- **Location:** `test-results/artifacts/`

## Writing Tests

### Basic Page Test

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/vboilerplate/);
});
```

### API Test

```typescript
test('GET /api/users returns 401 without auth', async ({ request }) => {
  const response = await request.get('http://localhost:3001/api/users');
  expect(response.status()).toBe(401);
});
```

### Authenticated Test

```typescript
// Helper to login and get cookies
async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  return extractCookies(response);
}

test('authenticated user can access /api/users', async ({ request }) => {
  const cookies = await login(request, 'admin@test.local', 'password');

  const response = await request.get(`${API_URL}/api/users`, {
    headers: { Cookie: cookies },
  });

  expect(response.status()).toBe(200);
});
```

### UI Flow Test

```typescript
test('login flow', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByLabel(/email/i).fill('user@test.local');
  await page.getByLabel(/password/i).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL('/');
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup
      run: |
        pnpm install
        pnpm e2e:setup  # Install Playwright browsers

    - name: Start services
      run: docker compose up -d

    - name: Run E2E tests
      run: pnpm e2e
      env:
        CI: true
        BASE_URL: http://localhost:5173
        API_URL: http://localhost:3000

    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: e2e-results
        path: apps/e2e/test-results/
```

### Docker Compose

```bash
# Run full stack + tests in containers
pnpm e2e:docker

# Cleanup
pnpm e2e:docker:down
```

## Debugging

### Visual Debugging

```bash
# Run single test in headed mode with debugger
pnpm test:debug -- -g "login flow"
```

### Trace Viewer

```bash
# After test failure, open trace
npx playwright show-trace test-results/artifacts/trace.zip
```

### UI Mode

```bash
# Interactive test runner with time-travel debugging
pnpm test:ui
```

## Test Data

Tests create their own test users:

| Email                   | Role   | Org          |
| ----------------------- | ------ | ------------ |
| `e2e-owner@test.local`  | OWNER  | E2E Test Org |
| `e2e-admin@test.local`  | ADMIN  | E2E Test Org |
| `e2e-member@test.local` | MEMBER | E2E Test Org |
| `org1-owner@test.local` | OWNER  | Test Org 1   |
| `org2-owner@test.local` | OWNER  | Test Org 2   |

**Note:** Tests assume a clean database or handle existing users gracefully.

## Best Practices

1. **Use role selectors** - `getByRole()`, `getByLabel()`, `getByText()`
2. **Avoid hard waits** - Use `expect()` with auto-retry
3. **Isolate tests** - Each test should be independent
4. **Clean up** - Tests create their own data, don't depend on seeds
5. **Use Page Object Model** - For complex pages (future)

## Related

- [Playwright Documentation](https://playwright.dev/docs/intro)
- `apps/web` - Frontend being tested
- `apps/api` - API being tested
