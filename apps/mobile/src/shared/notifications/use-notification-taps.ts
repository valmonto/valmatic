import { useRouter } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import { useEffect } from 'react';
import { loadNotifications } from './load';

/** Pull the deep-link path out of a notification's `data` payload. */
function routeFromResponse(response: NotificationResponse | null): string | null {
  const path = response?.notification.request.content.data?.path;
  return typeof path === 'string' ? path : null;
}

/**
 * Wires **tap → screen**: a notification may carry a `data.path` (e.g.
 * `{ "path": "/showcase/button" }`); tapping it routes there.
 *
 * It asks for NO permission and fetches no push token. It used to register
 * for push as soon as somebody signed in — a permission prompt with nothing
 * in front of it, and a token that was never sent anywhere. Ask where the
 * user turns the feature on (`registerForPushNotificationsAsync` in ./push).
 */
export function useNotificationTaps() {
  const router = useRouter();

  // Deep-link routing: cold-start (opened from a notification) + warm taps.
  // Nothing to route where the module cannot run (web, Android Expo Go).
  useEffect(() => {
    const loading = loadNotifications();
    if (!loading) return;
    let cancelled = false;
    let sub: { remove: () => void } | undefined;
    void loading.then((Notifications) => {
      if (cancelled) return;
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        const path = routeFromResponse(response);
        if (path) router.push(path as never);
      });
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const path = routeFromResponse(response);
        if (path) router.push(path as never);
      });
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router]);
}
