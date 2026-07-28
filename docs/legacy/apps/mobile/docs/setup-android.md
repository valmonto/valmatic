# Android setup — Linux · macOS · Windows

Do the [shared setup](./development.md) (§1–§3) first. This page gets you from nothing
to the app running on an Android phone or emulator. Works on all three OSes; the only
differences are install locations and how you set environment variables.

You need **two** things Android-specific: the **Android SDK** and a **JDK 17**.

---

## 1. Install the Android SDK (all OSes)

**Easiest for everyone: install [Android Studio](https://developer.android.com/studio).**
Run it once and let its **Setup Wizard** install the SDK + platform-tools + an emulator.
Then open **Settings → Languages & Frameworks → Android SDK** and, under **SDK Platforms**
and **SDK Tools**, make sure these are checked (install if not):

- SDK Platform **Android 16 (API 36)**
- **Android SDK Build-Tools**
- **Android SDK Platform-Tools**  ← gives you `adb`
- **Android Emulator** (only if you'll use an emulator)

The SDK lands in a default location — note it, you'll need it below:

| OS | Default SDK path |
| --- | --- |
| Linux | `~/Android/Sdk` |
| macOS | `~/Library/Android/sdk` |
| Windows | `%LOCALAPPDATA%\Android\Sdk` |

> CLI-only alternative (no GUI): install `cmdline-tools`, then
> `sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "emulator"`
> and accept licenses with `sdkmanager --licenses` (or `yes | sdkmanager --licenses`).

---

## 2. Install JDK 17 (all OSes)

The Gradle build for React Native 0.86 needs **exactly JDK 17** — newer JDKs (21/25)
fail. Install **Temurin 17** from [adoptium.net](https://adoptium.net/temurin/releases/?version=17).

| OS | Quick install |
| --- | --- |
| Linux | download the `.tar.gz`, unpack to a stable path e.g. `~/jdks/jdk-17…`; or `sudo apt install temurin-17-jdk` |
| macOS | `brew install --cask temurin@17` (or the `.pkg` installer) |
| Windows | run the **Temurin 17 `.msi`**, tick "Set JAVA_HOME" if offered |

Confirm the 17 install works:

```bash
# use the FULL path to be sure you're testing 17, not the system default
"<jdk17-path>/bin/java" -version   # should print 17.x
```

---

## 3. Set environment variables

Set `ANDROID_HOME`, add `platform-tools` to `PATH`, and point `JAVA_HOME` at JDK 17.

### Linux / macOS (add to `~/.bashrc` or `~/.zshrc`)

```bash
# Linux SDK path shown; macOS: ~/Library/Android/sdk
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

export JAVA_HOME="$HOME/jdks/jdk-17.0.19+10"   # ← your JDK 17 path
export PATH="$JAVA_HOME/bin:$PATH"
```

Reload: `source ~/.bashrc` (or open a new terminal).

### Windows (PowerShell, one-time — sets *persistent* user env vars)

```powershell
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"   # ← your JDK 17 path
# add platform-tools to PATH:
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

Close and reopen the terminal for `setx` to take effect.

### Verify (any OS)

```bash
adb --version      # resolves → platform-tools on PATH
java -version      # prints 17.x → JAVA_HOME correct
```

> If Gradle later complains about the Java version, the app's **generated**
> `apps/mobile/android/gradle.properties` can hardcode it:
> `org.gradle.java.home=<absolute path to JDK 17>`. That folder is gitignored, so this
> is per-machine and safe.

---

## 4. First build → installs the app on a device/emulator

Connect a device (§5) or start an emulator (§6) **first**, then:

```bash
cd apps/mobile
pnpm android        # = expo run:android — generates android/, Gradle build, installs
```

The first build is slow (downloads Gradle, compiles). Subsequent JS changes don't need
this — see [daily dev](./development.md#4-daily-development). Re-run `pnpm android` only
when native code/deps/`app.json` change.

---

## 5. Connect a physical phone

### Turn on developer mode (once)

1. **Settings → About phone → tap "Build number" 7 times** → "You are now a developer".
2. **Settings → System → Developer options** → enable **USB debugging** (and **Wireless
   debugging** if going cable-free).

### Option A — USB (simplest, all OSes)

Plug in the phone, tap **Allow** on the "USB debugging" prompt, then:

```bash
adb devices        # should list your device as "device" (not "unauthorized")
```

- Windows: if the device doesn't show, install your phone maker's USB driver (or the
  "Google USB Driver" from the SDK Manager).

### Option B — Wireless (no cable; same Wi-Fi as your computer)

In **Developer options → Wireless debugging**:

1. Open **"Pair device with pairing code"** — it shows `IP:PAIR_PORT` + a **6-digit code**:

   ```bash
   adb pair 192.168.1.242:PAIR_PORT      # then type the 6-digit code
   ```

2. Then connect using the **main** Wireless-debugging `IP:CONNECT_PORT` (different port):

   ```bash
   adb connect 192.168.1.242:CONNECT_PORT
   adb devices
   ```

Wireless adb **drops when the phone sleeps** — just `adb connect IP:PORT` again. The
port can change if you toggle Wireless debugging off/on.

---

## 6. Or use an emulator

Create one in Android Studio (**Device Manager → Create device**), then:

```bash
emulator -list-avds
emulator -avd <name> -gpu host      # -gpu host = crisp hardware rendering
```

- Hardware acceleration: **Linux** needs KVM (`ls /dev/kvm`), **Windows** needs the
  Android Emulator Hypervisor Driver / WHPX, **macOS** works out of the box.
- On an emulator you can set `EXPO_PUBLIC_API_URL=http://localhost:3000` (a physical
  phone needs the LAN IP — see the [hub §3](./development.md#3-configure-the-api-url-env--do-not-skip-this)).

---

## Android troubleshooting

| Symptom | Fix |
| --- | --- |
| `Unsupported class file major version` / JDK error | Wrong Java. Use **JDK 17** (`java -version`); set `JAVA_HOME` or `org.gradle.java.home`. |
| `adb: no devices/emulators found` after sleep | Wireless adb dropped → `adb connect IP:PORT` again. USB → replug + re-accept prompt. |
| Device shows as `unauthorized` | Accept the "Allow USB debugging" dialog on the phone (re-plug if you missed it). |
| Windows: phone not detected over USB | Install the OEM USB driver / Google USB Driver; try a different cable/port. |
| Gradle downloads hang / SDK component missing | Open Android Studio SDK Manager, install the missing piece, accept licenses. |
| Metro serves stale JS after a dep change | Force-stop & relaunch the app, or `pnpm clean` then `pnpm start --clear`. |
| Login fails / network error | It's the API URL — see [hub networking](./development.md#networking-troubleshooting). |

Back to the **[setup hub](./development.md)** · iOS? **[iOS setup](./setup-ios.md)**
