# Building & shipping the mobile app (EAS)

The app builds and ships via **EAS** (Expo Application Services): cloud builds, store
submission, and **over-the-air (OTA) JS updates**. This doc is the release runbook.

> **Local dev builds** (`pnpm android` / `pnpm ios`) are for development only — they
> compile on your machine. **EAS** is for producing installable/store builds and OTA
> updates. You don't need a Mac for iOS builds on EAS (they build in the cloud).

## One-time setup (needs your Expo account)

These steps write an Expo project id into `app.json` and can't be pre-baked into the
repo — run them once:

```bash
cd apps/mobile
npx eas-cli@latest login              # sign in to your Expo account
npx eas-cli@latest init               # creates the EAS project → adds extra.eas.projectId to app.json
npx eas-cli@latest update:configure   # wires OTA updates → adds updates.url to app.json
```

After this, `app.json` will contain `extra.eas.projectId` and `updates.url` — commit those.

## What's already configured

- **`eas.json`** — three build profiles:

  | Profile       | Use                                               | Notes                                                       |
  | ------------- | ------------------------------------------------- | ----------------------------------------------------------- |
  | `development` | Dev client for testing native modules on a device | `developmentClient`, internal distribution, Android **APK** |
  | `preview`     | Share an installable build with testers           | internal distribution, Android **APK**                      |
  | `production`  | Store builds                                      | `autoIncrement` build number, App Store / Play formats      |

  Each maps to an **OTA channel** of the same name (`development` / `preview` / `production`).

- **`app.json`** — `runtimeVersion.policy: "appVersion"` (OTA updates only apply to a build
  with the same app `version`, so native changes never mismatch JS), iOS `bundleIdentifier`
  and Android `package` set.

## Building

```bash
# Cloud build (pick a profile + platform)
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform all
```

## Submitting to the stores

```bash
npx eas-cli@latest submit --profile production --platform ios      # App Store Connect
npx eas-cli@latest submit --profile production --platform android  # Play Console
```

Fill store credentials in `eas.json` → `submit.production` (Apple `ascAppId`,
Android service-account key path) or supply them interactively.

## Shipping an OTA update (JS/asset-only changes — no store review)

Because `expo-updates` is wired, JS/styling changes can go out **without a new build**,
as long as the native runtime is unchanged (same `runtimeVersion` / `version`):

```bash
npx eas-cli@latest update --channel production --message "Fix inbox filter"
```

Bump the app `version` (and rebuild) only when you change **native** code (add a native
module, change `app.json` plugins/permissions, bump the Expo SDK). OTA covers everything else.

## Before your first production ship

- **Change the app identifiers** — `android.package` and `ios.bundleIdentifier` are
  currently `com.anonymous.valmatic`. Set them to your real reverse-DNS id (e.g.
  `com.valmonto.valmatic`) before the first store build; they can't change afterward.
- Set the correct **app `name`**, icon, and splash for the brand.
- Configure `submit.production` credentials in `eas.json`.
