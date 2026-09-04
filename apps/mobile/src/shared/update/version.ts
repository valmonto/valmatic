import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

/** Compare dotted versions: 1 if a > b, -1 if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/** The installed app version (from `app.json` → `version`). */
export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * Minimum required version from app config `extra.minAppVersion`. For a true
 * force-update, fetch the minimum from your API at runtime and pass it to
 * `<ForceUpdateGate minVersion=…>` instead (so you can gate without a new build).
 */
export function getConfiguredMinVersion(): string | undefined {
  const v = Constants.expoConfig?.extra?.minAppVersion;
  return typeof v === 'string' ? v : undefined;
}

/** Open this app's store listing (App Store / Play Store). */
export function openStore(appStoreId?: string): void {
  const androidPackage = Constants.expoConfig?.android?.package;
  const url = Platform.select({
    ios: appStoreId
      ? `itms-apps://apps.apple.com/app/id${appStoreId}`
      : 'itms-apps://apps.apple.com',
    android: androidPackage
      ? `market://details?id=${androidPackage}`
      : 'https://play.google.com/store',
    default: undefined,
  });
  if (url) Linking.openURL(url).catch(() => {});
}
