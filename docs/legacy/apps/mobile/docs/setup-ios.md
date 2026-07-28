# iOS setup — macOS only

Do the [shared setup](./development.md) (§1–§3) first. This page gets you running on the
iOS Simulator or a real iPhone.

> **Hard requirement: a Mac.** Apple only allows building/signing iOS apps on macOS with
> Xcode. There is **no** iOS build path on Linux or Windows. If you're not on a Mac, you
> can still do all the JS/UI work and test on **Android** — iOS is Mac-only.

> **Status in this repo:** iOS hasn't been generated/run yet (no `ios/` folder). The
> steps below are the standard Expo iOS flow and will generate it on first build. If
> something here drifts from reality once we actually ship iOS, update this doc.

---

## 1. Install Xcode

1. Install **Xcode** from the Mac App Store (large download, be patient).
2. Open Xcode once and let it install additional components; accept the license.
3. Install the command line tools and point the toolchain at Xcode:

   ```bash
   xcode-select --install                                   # if not already installed
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```

---

## 2. Install CocoaPods

Native iOS deps are managed by **CocoaPods** (Ruby). Easiest install:

```bash
brew install cocoapods         # recommended (Homebrew)
# or: sudo gem install cocoapods
pod --version                  # verify
```

> Apple Silicon (M-series) note: if `pod install` errors with ffi/arch issues, run it
> once via `arch -x86_64 pod install`, or ensure you're on a recent CocoaPods.

---

## 3. First build → Simulator

The Simulator ships with Xcode (no device or Apple account needed):

```bash
cd apps/mobile
pnpm ios            # = expo run:ios — generates ios/, runs pod install, builds, boots the Simulator
```

The first build is slow. After that, JS/TS changes hot-reload via Metro with no rebuild
(see [daily dev](./development.md#4-daily-development)). On the Simulator you may use
`EXPO_PUBLIC_API_URL=http://localhost:3000`.

Pick a specific simulator:

```bash
pnpm ios --device "iPhone 16 Pro"
xcrun simctl list devices          # see available simulators
```

---

## 4. Run on a real iPhone

More involved than Android because Apple requires code signing.

### One-time

1. Sign in with an **Apple ID** in **Xcode → Settings → Accounts** (a free Apple ID
   works for development; a paid **Apple Developer Program** account is only needed for
   TestFlight/App Store).
2. Connect the iPhone via USB; on the phone tap **Trust This Computer**.
3. On the iPhone enable **Developer Mode**: **Settings → Privacy & Security → Developer
   Mode → On**, then restart the phone.

### Signing

1. Generate the native project once if you haven't: `pnpm ios` (creates `ios/`).
2. Open the workspace in Xcode: `open ios/*.xcworkspace`.
3. Select the app target → **Signing & Capabilities** → check **Automatically manage
   signing** and pick your **Team** (your Apple ID). Xcode creates a provisioning
   profile. If the bundle id clashes, change it to something unique to you.

### Build & trust

```bash
cd apps/mobile
pnpm ios --device            # choose your connected iPhone
```

First launch: on the iPhone go to **Settings → General → VPN & Device Management →
Developer App → Trust**. Then reopen the app.

> A physical iPhone **cannot** use `localhost` for the API — set `EXPO_PUBLIC_API_URL`
> to your Mac's LAN IP (see [hub §3](./development.md#3-configure-the-api-url-env--do-not-skip-this)),
> same Wi-Fi, firewall open on port 3000.

---

## iOS troubleshooting

| Symptom | Fix |
| --- | --- |
| `pnpm ios` fails at `pod install` | `cd ios && pod install --repo-update`; on Apple Silicon try `arch -x86_64 pod install`. |
| "No development team" / signing error | Add your Apple ID in Xcode → Accounts, enable *Automatically manage signing*, pick a Team, use a unique bundle id. |
| App installs but won't open on device | Trust the developer: Settings → General → VPN & Device Management → Trust. Ensure Developer Mode is on. |
| Simulator can't reach the API | Simulator can use `localhost`; if the API is remote, use the LAN IP. |
| Build errors after switching Node/deps | `pnpm clean`, delete `ios/Pods` + `ios/Podfile.lock`, re-run `pnpm ios`. |
| Real phone: network/login fails | API URL must be the Mac's LAN IP — see [hub networking](./development.md#networking-troubleshooting). |

Back to the **[setup hub](./development.md)** · Android? **[Android setup](./setup-android.md)**
