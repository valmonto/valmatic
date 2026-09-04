# Push notifications

Push is wired on the **client**: permission request, Expo push-token registration,
a foreground handler, and **tap → deep-link routing**. It's **free** (Expo push
service + FCM + APNs). Sending pushes and storing device tokens are the two pieces
you finish per project.

> **Native module** — `expo-notifications` was added, so the dev client must be
> **rebuilt** once: `pnpm android` / `pnpm ios`. It won't hot-reload in.

## What's already in the app

- `shared/notifications/push.ts` — foreground behavior + `registerForPushNotificationsAsync()`
  (physical-device check, Android channel, permission, Expo push token) and a reusable
  `requestNotificationPermission()`.
- `shared/notifications/use-push-notifications.ts` — a hook mounted in `_layout.tsx`
  (enabled once signed in) that registers and routes notification taps.
- `app.json` — the `expo-notifications` plugin (accent color `#6366f1`).

## Deep-linking convention

Every notification carries a `data.path`; tapping it routes there (cold start + warm):

```json
{ "title": "New comment", "body": "Grace replied", "data": { "path": "/showcase/button" } }
```

`use-push-notifications.ts` reads `data.path` and calls `router.push(path)`.

## Setup (once per project — needs your accounts)

1. **EAS project id** — `getExpoPushTokenAsync` needs it:
   ```bash
   cd apps/mobile && npx eas-cli@latest init   # writes extra.eas.projectId to app.json
   ```
   Until this is done, registration returns `null` (logged in dev) — no crash.
2. **Android (FCM)** — create a Firebase project, download `google-services.json`, and upload
   your FCM v1 service-account key to EAS:
   ```bash
   npx eas-cli@latest credentials   # Android → Push Notifications (FCM)
   ```
3. **iOS (APNs)** — EAS provisions the push key for you during `eas credentials` (iOS) or the
   first `eas build`.

## Backend changes required (API)

The API stores in-app notifications (`apps/api/src/notifications`, `notification` table)
but has **no device-token storage and no push sending**. To target real devices, add a
`device` resource and a push sender. Follow the existing module conventions
(Drizzle schema → Zod contract → NestJS controller/service/repository).

### 1. Database — a `device` table

`packages/database/src/schema/device.ts` (mirror `notification.ts`); register it in
`schema/index.ts` and generate a migration (the repo's drizzle migrate flow).

```ts
export const devicePlatformEnum = pgEnum('device_platform', ['ios', 'android', 'web']);

export const device = pgTable(
  'device',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(), // ExponentPushToken[…]
    platform: devicePlatformEnum('platform').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('device_user_id_idx').on(t.userId)],
);
```

### 2. Contracts — `device.schema.ts`

`packages/contracts/src/schemas/device.schema.ts` (export from `schemas/index.ts`):

```ts
export const RegisterDeviceRequestSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});
export const RegisterDeviceResponseSchema = z.object({ success: z.boolean() });
export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
```

### 3. API module — `apps/api/src/devices/`

Controller/service/repository/module like `notifications`; register in `app.module.ts`.
Add `device:*` permissions (see `@pkg/contracts` `permissions.ts` / the `@Permissions` decorator).

```ts
@Controller('devices')
export class DeviceController {
  @Post()  @Permissions('device:create')
  register(@Body() dto: RegisterDeviceRequest, @ActiveUser() user): Promise<RegisterDeviceResponse> { … }

  @Delete(':token')  @Permissions('device:delete')
  unregister(@Param('token') token: string, @ActiveUser() user): Promise<void> { … }
}
```

`register` should **upsert** on `token` (unique) and update `userId` + `lastSeenAt` (a device
can move between users). `unregister` deletes the row — call it on logout.

### 4. Push sender — `expo-server-sdk`

Add `expo-server-sdk` to `apps/api` (or `apps/worker` if you send from jobs). A `PushService`
sends to a user's tokens; wire it into `NotificationService.create()` so creating a
notification with `channel: 'push'` also delivers a push:

```ts
import Expo from 'expo-server-sdk';
const expo = new Expo(); // no secret needed — Expo relays to FCM/APNs

async send(tokens: string[], n: { title: string; body?: string; path?: string }) {
  const messages = tokens.filter(Expo.isExpoPushToken).map((to) => ({
    to, sound: 'default', title: n.title, body: n.body,
    data: { path: n.path }, // ← the mobile deep-link key
  }));
  for (const chunk of expo.chunkPushNotifications(messages)) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    // On a `DeviceNotRegistered` ticket/receipt → delete that token from `device`.
  }
}
```

> **No FCM/APNs keys in the API.** Using the Expo Push API, Expo relays to FCM/APNs —
> you only configure FCM/APNs **credentials in EAS** (client setup above). If you skip
> Expo and hit FCM/APNs directly, then the API needs those keys.

### 5. Client hookups (the two `// TODO`s)

- `use-push-notifications.ts` → after `registerForPushNotificationsAsync()`, `POST /devices`
  (add `features/devices/api.ts`, same pattern as `features/notifications`).
- `auth-store.ts` `signOut()` → `DELETE /devices/:token` before clearing the session.

### Payload convention

Server push `data.path` ⇄ client deep-link. Keep them in sync (e.g. the notification's
`link` column → `data.path`).

## Test a push (no backend needed)

With a real device + a registered token, use Expo's tool:
<https://expo.dev/notifications> — paste the `ExponentPushToken[…]`, add
`data: { "path": "/showcase/button" }`, and send. Tapping it should deep-link.
