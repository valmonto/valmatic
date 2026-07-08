import '@/styles/global.css';
import '@/shared/lib/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { StatusBar } from 'expo-status-bar';
import { Toaster } from '@/components/ui/toast';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { SWRProvider } from '@/shared/api/swr-provider';
import { ForceUpdateGate } from '@/shared/update/force-update';
import { usePushNotifications } from '@/shared/notifications/use-push-notifications';
import { useAuthStore } from '@/shared/auth/auth-store';
import { AnimatedSplash } from '@/shared/components/animated-splash';

SplashScreen.preventAutoHideAsync();

// Freeze off-screen routes so covered screens stop re-rendering until refocused
// — less background work, snappier foreground.
enableFreeze(true);

// Navigation themes whose `background` matches the app's `--background` token, so
// the native-stack transition container isn't the default white (which flashes
// white on push/pop in dark mode before the screen paints).
const NAV_LIGHT = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#fbfbfc', card: '#fbfbfc' },
};
const NAV_DARK = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#161619', card: '#161619' },
};

/** Redirects between the login screen and the app based on auth status. */
function useAuthGate() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'loading') return;
    // The native splash is hidden by AnimatedSplash, which takes over from it
    // seamlessly and reveals the app once auth has routed to the right screen.

    const onLoginScreen = segments[0] === 'login';
    if (status === 'unauthenticated' && !onLoginScreen) {
      router.replace('/login');
    } else if (status === 'authenticated' && onLoginScreen) {
      router.replace('/');
    }
  }, [status, segments, router]);
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const authStatus = useAuthStore((s) => s.status);
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  useAuthGate();
  // Register for push + wire notification-tap → deep link (only once signed in,
  // so the OS permission prompt isn't shown on the login screen).
  usePushNotifications({ enabled: authStatus === 'authenticated' });

  const isDark = colorScheme === 'dark';
  const navTheme = isDark ? NAV_DARK : NAV_LIGHT;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SWRProvider>
        <ThemeProvider value={navTheme}>
          {/* `auto` = dark icons on light bg, light icons on dark bg, following
              the same colour scheme NativeWind uses. Without this the icons stay
              light (left over from the blue splash) and vanish on the white app. */}
          <StatusBar style="auto" />
          <ForceUpdateGate>
          <Stack
            screenOptions={{
              headerShown: false,
              // Opaque dark container so transitions don't flash white in dark mode.
              contentStyle: { backgroundColor: navTheme.colors.background },
              // Slide (not the Android default cross-fade, which ghosts both
              // screens through each other) — the opaque screen slides over cleanly.
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="task/[id]" />
            <Stack.Screen name="new-task" options={{ presentation: 'modal' }} />
            <Stack.Screen name="showcase/index" />
            <Stack.Screen name="showcase/[id]" />
            <Stack.Screen name="blocks/index" />
            <Stack.Screen name="blocks/[id]" />
          </Stack>
          {/* Overlay host for RNR dialog/select/dropdown/popover/tooltip/etc. */}
          <PortalHost />
          <Toaster />
          </ForceUpdateGate>
          {!splashDone && (
            <AnimatedSplash
              ready={authStatus !== 'loading' && fontsLoaded}
              onFinish={() => setSplashDone(true)}
            />
          )}
        </ThemeProvider>
        </SWRProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
