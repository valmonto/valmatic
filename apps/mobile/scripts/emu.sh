#!/usr/bin/env bash
# Android emulator PROVISIONING — the one part no existing tool covers.
# Interaction (screenshot, tap, type, inspect) is mobile-mcp's job, wired in
# .mcp.json: with a booted emulator, agent sessions get those tools natively.
set -euo pipefail

AVD_NAME="${AVD_NAME:-valmatic-dev}"
SYS_IMAGE="system-images;android-35;google_apis;x86_64"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ '$1' not found. Install the Android SDK command-line tools and ensure"
    echo "  \$ANDROID_HOME/platform-tools and cmdline-tools/latest/bin are on PATH."
    echo "  (On Linux the emulator also needs KVM.)"
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
    need emulator; need adb
    emulator -avd "$AVD_NAME" -no-snapshot-save -no-audio &
    adb wait-for-device
    echo "✓ Emulator booted. Open the app: pnpm --filter @pkg/mobile start, then press 'a'."
    echo "  Agent sessions now have mobile-mcp tools (screenshot, tap, inspect)."
    ;;
  *)
    echo "usage: emu.sh setup | start"
    ;;
esac
