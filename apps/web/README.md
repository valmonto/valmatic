# Web App (`@pkg/web`)

React SPA for the vboilerplate platform.

## Tech Stack

| Category      | Technology                               |
| ------------- | ---------------------------------------- |
| Framework     | React 19                                 |
| Build         | Vite + SWC                               |
| Styling       | Tailwind CSS 4                           |
| Routing       | React Router 7                           |
| Data Fetching | SWR                                      |
| State         | Zustand (global), React Context (scoped) |
| Forms         | react-hook-form                          |
| i18n          | i18next                                  |
| UI Components | Radix UI + shadcn/ui                     |

## Project Structure

```
src/
├── api/                    # API client layer
│   ├── http.ts             # Axios instance with interceptors
│   ├── index.ts            # Aggregated API exports
│   └── resources/          # Resource-specific API calls
│       ├── auth.ts
│       ├── jobs.ts
│       ├── notifications.ts
│       ├── org.ts
│       └── user.ts
│
├── components/
│   ├── ui/                 # UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── features/           # Feature-specific components
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   ├── org/
│   │   └── users/
│   └── layouts/            # Layout components
│       └── dashboard-layout/
│
├── context/                # React Context + Zustand stores
│   ├── auth-context.tsx    # Auth state (Context)
│   └── notification-store.ts # Notifications (Zustand)
│
├── hooks/                  # Custom React hooks
│   ├── use-action-request.ts  # Async action wrapper
│   ├── use-cached-request.ts  # SWR wrapper
│   └── use-mobile.ts          # Responsive breakpoint
│
├── lib/                    # Utilities and configuration
│   ├── i18n.ts             # i18next setup
│   ├── router.tsx          # React Router config
│   └── utils.ts            # Helper functions (cn, etc.)
│
├── pages/                  # Route pages
│   ├── ~.app.page.tsx      # App layout (authenticated)
│   ├── ~.auth.page.tsx     # Auth layout (unauthenticated)
│   ├── ~404.page.tsx       # Not found
│   ├── ~error.page.tsx     # Error boundary
│   ├── index.page.tsx      # Dashboard
│   ├── users.page.tsx
│   ├── settings.page.tsx
│   ├── jobs.page.tsx
│   └── auth/
│       ├── login.page.tsx
│       └── register.page.tsx
│
├── styles/                 # Global styles
│   ├── index.css           # Tailwind imports
│   └── theme.css           # CSS variables
│
└── main.tsx                # App entry point
```

## Key Patterns

### API Calls

All API calls go through typed resource functions:

```tsx
import { api } from '@/api';

// In a component
const users = await api.user.list({});
const user = await api.user.get({ id: '123' });
await api.auth.login({ email, password });
```

### Data Fetching with SWR

Use `useCachedRequest` for cached GET requests:

```tsx
import { useCachedRequest } from '@/hooks/use-cached-request';
import { api } from '@/api';

function UserList() {
  const { data, error, isLoading, mutate } = useCachedRequest({
    key: '/api/users',
    fetcher: () => api.user.list({}),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  return <List items={data} />;
}
```

### Mutations with useActionRequest

Use `useActionRequest` for POST/PUT/DELETE actions:

```tsx
import { useActionRequest } from '@/hooks/use-action-request';
import { api } from '@/api';

function CreateUserForm() {
  const { execute, isLoading, error } = useActionRequest(api.user.create);

  const handleSubmit = async (data: FormData) => {
    const { e, d } = await execute(data);
    if (e) return; // Error already set in hook
    toast.success('User created');
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Authentication

Access auth state via `useAuth` hook:

```tsx
import { useAuth } from '@/context/auth-context';

function Profile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (!isAuthenticated) return <Redirect to="/auth/login" />;
  return <div>Welcome, {user.name}</div>;
}
```

### Global State (Zustand)

For high-frequency updates accessible outside React:

```tsx
// In React component
import { useNotificationStore } from '@/context/notification-store';

const notifications = useNotificationStore((s) => s.notifications);
const addNotification = useNotificationStore((s) => s.addNotification);

// Outside React (e.g., axios interceptor)
import { useNotificationStore } from '@/context/notification-store';

useNotificationStore.getState().addNotification('error', 'Request failed');
```

### i18n / Translations

```tsx
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';

function Component() {
  const { t } = useTranslation();
  return <span>{t(k.common.save)}</span>;
}
```

### Adding UI Components

Use shadcn/ui CLI to add new components:

```bash
pnpm shadcn:add button
pnpm shadcn:add dialog
```

## Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:5173)

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage report

# Build & Preview
pnpm build            # Production build
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm typecheck        # TypeScript check
```

## File Naming Conventions

| Type         | Pattern           | Example                 |
| ------------ | ----------------- | ----------------------- |
| Pages        | `*.page.tsx`      | `users.page.tsx`        |
| Layout pages | `~.*.page.tsx`    | `~.app.page.tsx`        |
| Components   | `kebab-case.tsx`  | `user-list.tsx`         |
| Hooks        | `use-*.ts`        | `use-cached-request.ts` |
| Stores       | `*-store.ts`      | `notification-store.ts` |
| Tests        | `*.test.{ts,tsx}` | `button.test.tsx`       |

## Adding a New Page

1. Create page file in `src/pages/`:

   ```tsx
   // src/pages/products.page.tsx
   export default function ProductsPage() {
     return <div>Products</div>;
   }
   ```

2. Add route in `src/lib/router.tsx`:

   ```tsx
   {
     path: 'products',
     lazy: () => import('@/pages/products.page').then((m) => ({ Component: m.default })),
   },
   ```

3. Add to sidebar navigation in `src/components/layouts/dashboard-layout/index.tsx`

## Adding a New API Resource

1. Create resource file in `src/api/resources/`:

   ```tsx
   // src/api/resources/products.ts
   import { http } from '../http';
   import type { Product, CreateProductRequest } from '@pkg/contracts';

   export const products = {
     list: () => http.get<Product[]>('/api/products'),
     get: ({ id }: { id: string }) => http.get<Product>(`/api/products/${id}`),
     create: (dto: CreateProductRequest) => http.post<Product>('/api/products', dto),
   };
   ```

2. Export from `src/api/index.ts`:

   ```tsx
   import { products } from './resources/products';

   export const api = {
     // ...existing
     products,
   };
   ```

## Testing

Tests are located in `__tests__/` directory:

```
__tests__/
├── setup.ts              # Global test setup
├── mocks/
│   ├── handlers.ts       # MSW API handlers
│   ├── server.ts         # MSW server
│   ├── providers.tsx     # Test wrapper components
│   └── i18n.ts           # Test i18n config
├── components/
│   └── ui/
│       └── button.test.tsx
├── hooks/
│   └── use-action-request.test.ts
└── stores/
    └── notification-store.test.ts
```

### Writing Tests

```tsx
import { render, screen } from '../../mocks/providers';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Related Packages

- `@pkg/contracts` - Shared TypeScript types and Zod schemas
- `@pkg/locales` - Translation keys and resources
- `@pkg/utils` - Shared utility functions
