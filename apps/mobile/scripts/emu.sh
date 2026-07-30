#!/usr/bin/env bash
# Android emulator loop for agents and humans. Every subcommand degrades with
# a clear message when the host has no Android SDK — capability when present,
# honest failure when not.
set -euo pipefail

AVD_NAME="${AVD_NAME:-valmatic-dev}"
SYS_IMAGE="system-images;android-35;google_apis;x86_64"
SNAP_DIR="${SNAP_DIR:-/tmp/valmatic-emu}"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ '$1' not found. Install the Android SDK command-line tools and ensure"
    echo "  \$ANDROID_HOME/platform-tools and cmdline-tools/latest/bin are on PATH."
    echo "  (On Linux the emulator also needs KVM.)"
    exit 1
  }
}

booted() {
  adb get-state >/dev/null 2>&1 || {
    echo "✗ No device/emulator connected. Start one:  pnpm emu:start"
    exit 1
  }
}

case "${1:-help}" in
  setup)
    need sdkmanager; need avdmanager
    sdkmanager "platform-tools" "emulator" "$SYS_IMAGE"
    avdmanager list avd | grep -q "$AVD_NAME" ||
      avdmanager create avd -n "$AVD_NAME" -k "$SYS_IMAGE" --device pixel_7
    echo "✓ AVD '$AVD_NAME' ready. Boot it with:  pnpm emu:start"
    ;;
  start)
    need emulator
    emulator -avd "$AVD_NAME" -no-snapshot-save -no-audio &
    need adb
    adb wait-for-device
    echo "✓ Emulator booted. Open the app: pnpm --filter @pkg/mobile start, then press 'a'."
    ;;
  snap)
    need adb; booted
    mkdir -p "$SNAP_DIR"
    out="$SNAP_DIR/$(date +%H%M%S).png"
    adb exec-out screencap -p > "$out"
    echo "$out"      # print the path so an agent can Read the image
    ;;
  dump)
    need adb; booted
    adb shell uiautomator dump /sdcard/ui.xml >/dev/null
    adb shell cat /sdcard/ui.xml
    ;;
  tap)
    need adb; booted
    adb shell input tap "${2:?usage: emu.sh tap X Y}" "${3:?usage: emu.sh tap X Y}"
    ;;
  text)
    need adb; booted
    adb shell input text "${2:?usage: emu.sh text STRING}"
    ;;
  *)
    echo "usage: emu.sh setup | start | snap | dump | tap X Y | text STRING"
    ;;
esac
