# Deep linking & universal links

Two ways to open a screen from outside the app. **Routes map automatically** —
because Expo Router is file-based, a link path is the route path
(`…/showcase/button` → `app/showcase/[id].tsx`).

## 1. Custom scheme — `valmatic://` (works now, no setup)

```
valmatic://showcase/button
valmatic://blocks/sign-in
```

Test on a device:
```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "valmatic://showcase/button"
# iOS Simulator
xcrun simctl openurl booted "valmatic://showcase/button"
```
This is also what push-notification taps use (`data.path`, see push-notifications.md).

## 2. Universal / App Links — `https://…` (needs your domain)

So a tapped `https://app.valmonto.com/showcase/button` opens the app instead of the
browser. Configured in `app.json`:

- **iOS** — `ios.associatedDomains: ["applinks:app.valmonto.com"]`
- **Android** — `android.intentFilters` with `autoVerify: true` for the `https` host

> These are **native config** — change the host to your real domain, then **rebuild**
> (`pnpm android` / `pnpm ios`); they don't hot-reload.

### Host the two verification files (required — links won't open the app without them)

**iOS — `https://app.valmonto.com/.well-known/apple-app-site-association`** (JSON, served
as `application/json`, no redirects):
```json
{
  "applinks": {
    "details": [
      { "appIDs": ["<TEAM_ID>.com.valmonto.valmatic"], "components": [{ "/": "/*" }] }
    ]
  }
}
```
`TEAM_ID` = your Apple Developer Team ID (Apple Developer → Membership).

**Android — `https://app.valmonto.com/.well-known/assetlinks.json`**:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.valmonto.valmatic",
      "sha256_cert_fingerprints": ["<SHA256_OF_SIGNING_CERT>"]
    }
  }
]
```
Get the fingerprint from EAS (the signing cert used for the build):
```bash
npx eas-cli@latest credentials   # Android → shows the SHA-256 fingerprint
```

### Verify

- Android: `adb shell pm verify-app-links --re-verify com.valmonto.valmatic`, then
  `adb shell am start -a android.intent.action.VIEW -d "https://app.valmonto.com/showcase/button"`.
- iOS: tap an `https://app.valmonto.com/…` link in Notes/Messages on a device with the app installed.

### Checklist before this works
- [ ] Replace `app.valmonto.com` with your real domain (and `com.anonymous.valmatic` with your id).
- [ ] Host both `.well-known` files over HTTPS (correct content-type, no redirects).
- [ ] Fill `TEAM_ID` (iOS) and the SHA-256 fingerprint (Android).
- [ ] Rebuild the app after the `app.json` change.
