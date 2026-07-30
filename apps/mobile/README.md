# `apps/mobile`

The Expo / React Native app. Shares types, permissions and translations with the
API through `@pkg/contracts` and `@pkg/locales`, so a shape change breaks the
build here too.

Styling is NativeWind (Tailwind for React Native); server state is SWR, the same
as `apps/web`.

## Structure

```
src/
├── app/          routes — file-based, Expo Router
├── features/     one folder per domain: auth · blocks · notifications · showcase
├── components/   60 UI primitives (rn-primitives)
├── shared/       api client, auth, hooks, notifications, update
└── styles/
```

`features/` and `shared/` mirror `apps/web` deliberately — the same domain
concepts in both places, so moving between them is not a context switch.

## Routing is the file tree

Unlike the web app, where each feature exports a route array, **Expo Router
derives routes from `src/app/`**:

```
app/
├── _layout.tsx        root layout, providers
├── login.tsx          → /login
├── (tabs)/
│   ├── _layout.tsx    the tab bar
│   ├── index.tsx      → /
│   └── tasks.tsx      → /tasks
└── task/[id].tsx      → /task/:id
```

`(tabs)` is a **group**: parentheses organise files without appearing in the
URL. A file added under `app/` is a route the moment it exists — so screens
that are not routes belong in `features/x/screens/`, imported by a thin file
under `app/`.

## Auth works differently from web

This is the difference that matters most.

| | Web | Mobile |
|---|---|---|
| Token transport | httpOnly cookies | `Authorization: Bearer` |
| Storage | the browser | device keychain / keystore |
| Signalled by | — | `X-Client: mobile` header |

The API returns tokens in the response body **only** when it sees
`X-Client: mobile`; web clients get cookies and never see the token. Every
request from here carries that header.

Tokens live in `expo-secure-store` — the keychain on iOS, keystore on Android —
never `AsyncStorage`, which is plain text.

Refresh is **single-flight**: concurrent 401s share one refresh round-trip, and
the refresh call itself uses a bare client with no interceptors so a 401 from
`/auth/refresh` cannot recurse. When refresh fails the auth store is cleared and
the user returns to login.

On the **web target** (`pnpm web`), `expo-secure-store` is unavailable and
tokens fall back to `localStorage`. Fine for previewing; a real web deployment
is `apps/web`, which uses cookies.

## Components

`components/ui/` holds ~60 primitives built on `@rn-primitives` — the React
Native counterpart to the web app's shadcn set, styled with NativeWind. Same
rule as web: they are copy-in and yours to edit, and anything domain-aware
belongs in `features/x/`.

`app/showcase/` renders them live, which is the fastest way to find one.

## Adding a feature

1. `features/thing/` with `api.ts`, `screens/`, `index.ts`.
2. Types from `@pkg/contracts` — `import type`, never a hand-written shape.
3. Add a file under `app/` that renders the screen; that *is* the route.
4. Data through SWR, mutations through the shared hooks.

## Lint

`pnpm lint` at the root **skips this app**. The React Compiler rules flag
`sharedValue.value = …` as a mutation, which is the documented
react-native-reanimated API — ten false positives that would make a red gate
meaningless. Run it deliberately:

```bash
pnpm lint:mobile
```

Typecheck still covers mobile, and `pnpm verify` runs it.

## Commands

```bash
pnpm start                      # Expo dev server
pnpm ios / pnpm android         # native builds
pnpm web                        # browser preview
pnpm --filter @pkg/mobile typecheck
```

Point the app at a reachable API — `localhost` is the device's own loopback, not
your machine's.

## Setup and release

Device setup, deep linking, push notifications and EAS deployment are covered in
[`docs/legacy/apps/mobile/docs/`](../../docs/legacy/apps/mobile/docs):
`setup-ios.md`, `setup-android.md`, `development.md`, `deep-linking.md`,
`push-notifications.md`, `deploy-eas.md`, `force-update-and-review.md`.

## Testing

There are no tests yet — the only workspace without any (tracked in
[`GAPS.md`](../../GAPS.md)). When adding them: vitest is already configured
via `@pkg/vitest-config`, and [`@pkg/testing`](../../packages/testing/README.md)
explains which kind of test fits what.

## Verifying native behaviour

Web preview runs fallback code for native modules (tokens.ts literally
branches on platform), so anything touching secure storage, push, haptics or
blur is verified on an emulator, not a browser. The loop ships ready to run:

```bash
pnpm --filter @pkg/mobile emu:setup   # one-time: SDK images + AVD (needs KVM on Linux)
pnpm --filter @pkg/mobile emu:start   # boot the emulator
pnpm --filter @pkg/mobile start       # press 'a' to open the app on it
```

That is ALL the scripts do — provisioning, the one part no existing tool
covers. Interaction is mobile-mcp's job (`.mcp.json`): with a booted emulator,
agent sessions natively get see-screen / tap-by-label / type / inspect tools;
on hosts without one the server reports unavailable and nothing else is
affected. Both scripts degrade with a clear message when the SDK is absent.

What no emulator verifies: how haptics FEEL, and true end-to-end push
delivery — those stay a two-minute human check on a real phone.
