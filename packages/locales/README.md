# `@pkg/locales`

Translation keys and strings, shared by every app so one wording change lands
everywhere. Ships the `k` key catalogue, the translation JSON, and the i18next
config. No dependencies.

Currently `en`, `es`, `lt` — 223 strings each.

## Layout

```
src/
├── keys/           auth · users · orgs · jobs · notifications · common · validation
├── translations/   en.json · es.json · lt.json — flat, dotted keys
└── index.ts        k, supportedLanguages, i18nConfig, detectLanguageFromHeader
```

`keys/` splits by domain, like `schemas/` and `constants/` in `@pkg/contracts`.

## The `k` catalogue

Keys are constants, not strings typed at the call site:

```ts
import { k } from '@pkg/locales';
t(k.auth.welcomeBack);        // ✅ a typo is a compile error
t('auth.welcomeBack');        // ✗ a typo renders the raw key to the user
```

Each entry maps a path to the flat key used in the JSON:

```ts
export const auth = { welcomeBack: 'auth.welcomeBack' } as const;
```

Translations are **flat** — `"auth.welcomeBack": "Welcome back"` — not nested
objects. The key string is the whole path.

## Errors are localized by the client

The API throws **keys**, not sentences:

```ts
// api
throw new UnauthorizedException(k.auth.errors.invalidEmailOrPassword);

// web
t(error.message || k.auth.errors.loginFailed);
```

So one error renders in each user's own language, and the server never guesses
which that is. The API can also translate directly — `I18nService` reads
`Accept-Language` via `detectLanguageFromHeader` — for anything the server
renders itself.

## Adding a string

1. Add the constant to the right `src/keys/*.ts` file.
2. Add the entry to **every** file in `src/translations/`. A key missing from
   `en.json` renders as its own raw path — i18next falls back to the key.
3. Use it as `t(k.domain.thing)`.

## Adding a language

1. Add the code to `supportedLanguages` in `src/index.ts`.
2. Add `src/translations/<code>.json` with **every** key translated.
3. Import and add it to the `translations` map.
4. Add its label to `languageNames` in
   `apps/web/src/shared/components/language-switcher.tsx` — the map is typed
   `Record<SupportedLanguage, string>`, so missing it fails `pnpm typecheck`.

Step 4 is easy to miss and has broken the build before: the type error surfaces
in the web app, not here.

## What the tests enforce

`__tests__/translations.test.ts` fails the build on the mistakes that otherwise
surface as raw keys in the UI:

- every value in `k` has an entry in **every** language
- no blank strings
- all three languages hold the identical key set
- entries stay flat strings, never nested objects

It understands i18next plurals, so `users.totalUsersCount` counts as translated
when `users.totalUsersCount_one` / `_other` exist.

This caught nine genuinely missing translations when it was written — the auth
error keys the API throws were rendering as `auth.errors.sessionExpired` to
users, because a missing key silently falls back to itself.
