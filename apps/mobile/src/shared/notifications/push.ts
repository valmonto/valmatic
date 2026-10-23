import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { loadNotifications } from './load';

/** The EAS project id (set by `eas init`) — required to fetch an Expo push token. */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/**
 * Request notification permission and return this device's **Expo push token**
 * (send it to your API to target the device). Returns `null` on a simulator,
 * where the module cannot run (web, Android Expo Go), when permission is
 * denied, or before `eas init` has set a project id.
 *
 * Nothing calls this yet. Call it from the screen where a user turns on the
 * feature that needs pushes — never at sign-in: a permission prompt with no
 * reason in front of it is declined, and app review flags it.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push only works on physical devices.
  if (!Device.isDevice) return null;
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  // Android needs a channel before notifications show.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const projectId = getProjectId();
  if (!projectId) {
    if (__DEV__)
      console.warn('[push] No EAS projectId yet — run `eas init`. Skipping token fetch.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/**
 * Request notification permission if not already granted. Returns whether it's
 * granted (`false` where the module cannot run). The reusable permission
 * pattern — extend with camera/photos/… the same way when those features are
 * added.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
