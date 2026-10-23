import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Whether `expo-notifications` can be loaded in this runtime at all.
 *
 * - Web: the module has no web implementation; calling it throws and Expo's
 *   error overlay takes every page of the web preview down.
 * - Android Expo Go: since SDK 53 the module THROWS WHILE IT IS IMPORTED — its
 *   push-token auto-registration side effect calls `addPushTokenListener`,
 *   which throws in Expo Go on Android. A top-level import anywhere on the
 *   root layout's import graph therefore takes the whole app down (the root
 *   route loses its default export). A development build is unaffected.
 *
 * That is why nothing imports the module statically: every caller goes
 * through {@link loadNotifications}, which is `null` where it cannot run.
 */
export const notificationsSupported =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

let loaded: Promise<NotificationsModule> | null = null;

/**
 * The `expo-notifications` module, or `null` where it cannot run. The first
 * load also installs the foreground handler, so it is in place before any
 * notification can arrive.
 */
export function loadNotifications(): Promise<NotificationsModule> | null {
  if (!notificationsSupported) return null;
  loaded ??= import('expo-notifications').then((Notifications) => {
    // How notifications behave while the app is in the foreground.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  });
  return loaded;
}
