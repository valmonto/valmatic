# Mobile app — setup & development (start here)

The mobile app (`apps/mobile`) is an **Expo SDK 57 / React Native** app in this pnpm
monorepo. This page is the **hub**: do the shared steps here, then follow the doc for
the platform you want to run on.

> **Mental model.** ~70% of the setup is identical on every OS: the app's UI is
> JavaScript/TypeScript bundled by **Metro** and hot-reloaded onto a device. What
> differs per OS + target is only the **native build** and **how you attach a device**:
>
> | Target | Linux | macOS | Windows |
> | --- | --- | --- | --- |
> | **Android** | ✅ | ✅ | ✅ |
> | **iOS** | ❌ | ✅ (Mac required) | ❌ |
>
> So: everyone does §1–§3 below. Then → **[Android setup](./setup-android.md)** and/or
> **[iOS setup](./setup-ios.md)** (iOS needs a Mac). Come back here for §4 (daily dev).

> **Don't use "Expo Go".** This app has custom native modules (Reanimated 4,
> expo-blur, expo-updates, RNR primitives, …), so it runs as a **dev build** you
> compile once with `expo run:android` / `run:ios`. The Expo Go sandbox app won't work.

---

## 1. Shared prerequisites (every OS)

| Tool | Version | Install |
| --- | --- | --- |
| **Git** | any | your OS package manager |
| **Node.js** | **≥ 26** (repo `engines`) | [nodejs.org](https://nodejs.org) LTS ≥26, or `nvm`/`fnm` |
| **pnpm** | **11.5.2** (pinned in `packageManager`) | `npm install -g pnpm@11.5.2` (or see [pnpm.io/installation](https://pnpm.io/installation)) |

Verify:

```bash
node -v            # v26+.x
pnpm -v            # 11.5.2
```

---

## 2. Clone & install (from the repo root)

```bash
git clone <repo-url> valmatic
cd valmatic
pnpm install       # installs the WHOLE monorepo (uses pnpm catalogs)
```

That's the only install command — pnpm resolves the mobile app's dependencies too.

---

## 3. Configure the API URL (`.env`) — **do not skip this**

The app talks to the backend API (defaults to port **3000**). On a **real phone or a
device that isn't the same machine as the API**, `localhost` means *the phone itself*,
so it must point at your **computer's LAN IP**.

1. Copy the example env file:

   ```bash
   cd apps/mobile
   cp .env.example .env        # Windows PowerShell: copy .env.example .env
   ```

2. Find your computer's LAN IP:

   | OS | Command |
   | --- | --- |
   | Linux | `hostname -I \| awk '{print $1}'` |
   | macOS | `ipconfig getifaddr en0` (Wi-Fi) |
   | Windows | `ipconfig` → your Wi-Fi adapter's **IPv4 Address** |

3. Set it in `apps/mobile/.env`:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.20:3000   # ← your LAN IP, NOT localhost
   ```

4. Start the backend so the phone can reach it. Run the API (`apps/api`) and make sure
   it listens on **all interfaces** (`0.0.0.0`), not just `localhost`, and that your
   firewall allows port **3000**. On an **emulator/simulator** you can use `localhost`
   (simulator) — a **physical phone always needs the LAN IP**.

> Requirement: the phone and your computer must be on the **same Wi-Fi/LAN**, and it
> must not be a "guest" network with *client isolation* (those block phone↔computer
> traffic). See [Networking troubleshooting](#networking-troubleshooting) below.

---

## 4. Daily development

After you've done your platform setup once (Android/iOS doc) and built the app to your
device, the everyday loop is just Metro — **no rebuild for JS/TS/styling changes**
(Fast Refresh applies them live):

```bash
cd apps/mobile
pnpm start          # Metro bundler; press "a" (Android) or "i" (iOS)
```

Scripts (`apps/mobile/package.json`): `pnpm typecheck`, `pnpm lint`,
`pnpm clean` (clears `.expo`/caches).

**You only need to rebuild** (`pnpm android` / `pnpm ios`) when *native* things change:
adding a native module, editing `app.json` plugins, or bumping the Expo SDK.

### Deep-linking to a screen (handy in dev)

The app scheme is `valmatic://`:

```bash
# Android (adb):
adb shell am start -a android.intent.action.VIEW -d "valmatic://showcase/button"
# iOS Simulator:
xcrun simctl openurl booted "valmatic://showcase/button"
```

---

## Networking troubleshooting

The #1 source of "it installed but login fails / Metro won't connect":

| Symptom | Cause & fix |
| --- | --- |
| Login/API calls fail on a real phone | `EXPO_PUBLIC_API_URL` is `localhost` or wrong LAN IP. Set it to the computer's LAN IP (§3). Restart Metro after editing `.env`. |
| API unreachable even with LAN IP | API is bound to `localhost` only → bind it to `0.0.0.0`; open firewall port 3000. |
| Metro won't connect to the phone | Phone and computer not on the same LAN, or a **guest/corporate Wi-Fi blocks it**. Use the same normal Wi-Fi, or run `pnpm start --tunnel` (routes via Expo's servers — slower but bypasses LAN issues). |
| Works on emulator, not on phone | Emulator/simulator can use `localhost`; a physical device cannot — it needs the LAN IP. |

---

## Platform docs

- 📱 **[Android setup](./setup-android.md)** — Linux · macOS · Windows
- 🍏 **[iOS setup](./setup-ios.md)** — macOS only
- 🚀 **[Build & ship (EAS)](./deploy-eas.md)** — cloud builds, store submit, OTA updates
- 🔔 **[Push notifications](./push-notifications.md)** — permission, tokens, deep-link routing
- 🔗 **[Deep linking & universal links](./deep-linking.md)** — `valmatic://` + https app links
- ⬆️ **[Force-update & in-app review](./force-update-and-review.md)** — version gating, rating prompt
- 🧩 **[Showcase components reference](./showcase-components.md)**

## Stack reference

- **Expo SDK 57**, Expo Router (file-based routes in `src/app`, thin re-exports to
  feature screens in `src/features`)
- **NativeWind v5** (Tailwind v4) — theme tokens in `src/styles/global.css`
- **React Native Reusables** (`@rn-primitives/*`) — copied-in UI in `src/components/ui`
- Font: **Inter** (loaded via `@expo-google-fonts/inter`)
- App id: `com.anonymous.valmatic` · scheme `valmatic://` · API port `3000`
