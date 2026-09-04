import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from './push';

/** Pull the deep-link path out of a notification's `data` payload. */
function routeFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const path = response?.notification.request.content.data?.path;
  return typeof path === 'string' ? path : null;
}

/**
 * Registers for push notifications and wires **tap → deep link**. Notifications
 * carry a `data.path` (e.g. `{ "path": "/showcase/button" }`); tapping one routes
 * there. Call once from the root, enabling it when the user is authenticated so
 * the OS permission prompt isn't shown on the login screen.
 */
export function usePushNotifications({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Register + get the device token once the user is authenticated.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    registerForPushNotificationsAsync().then((token) => {
      if (!cancelled) setPushToken(token);
      // TODO: POST the token to your API to register this device
      // (add e.g. `POST /devices` + a contract, then call it here).
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Deep-link routing: cold-start (opened from a notification) + warm taps.
  useEffect(() => {
    // expo-notifications has no web implementation: the call below throws on
    // the web preview and its error overlay blocks every page. Push is a
    // native feature; the web target simply has no notification taps.
    if (Platform.OS === 'web') return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const path = routeFromResponse(response);
      if (path) router.push(path as never);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const path = routeFromResponse(response);
      if (path) router.push(path as never);
    });
    return () => sub.remove();
  }, [router]);

  return { pushToken };
}
