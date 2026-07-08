import { DevSettings } from 'react-native';

/**
 * Fully restarts the app's JS runtime.
 *
 * In production/preview builds this uses `expo-updates` (`reloadAsync`), the
 * supported way to relaunch a standalone app. In development that API is a
 * no-op, so we fall back to Metro's `DevSettings.reload()` to reload the bundle.
 * expo-updates is required lazily so the dev path never touches its native side.
 */
export async function restartApp(): Promise<void> {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  const Updates = await import('expo-updates');
  await Updates.reloadAsync();
}
