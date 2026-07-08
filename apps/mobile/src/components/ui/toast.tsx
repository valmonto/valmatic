import { Spinner } from '@/components/ui/spinner';
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toaster as SonnerToaster, toast } from 'sonner-native';

// Concrete colors mirroring the theme tokens — RN toast styles can't read CSS
// vars, same as the Modal/Sheet surface tints. Neutrals for the card, semantic
// hues for the per-variant icons.
const SURFACE = {
  light: { card: '#ffffff', fg: '#26262b', muted: '#6f6f78', border: '#e6e6e9' },
  dark: { card: '#1c1c22', fg: '#ededf0', muted: '#9a9aa7', border: 'rgba(255,255,255,0.1)' },
};
const ACCENT = {
  success: { light: '#16a34a', dark: '#22c55e' },
  error: { light: '#dc2626', dark: '#f05252' },
  warning: { light: '#d97706', dark: '#f59e0b' },
  info: { light: '#2563eb', dark: '#3b82f6' },
};

const ICON = 20;

/**
 * The app's toast host — mount once at the root. Themed on-brand (glass card,
 * Inter, semantic Lucide icons, our Spinner for loading) and pinned top-center
 * below the status bar. Trigger with the re-exported `toast` (Sonner API).
 */
function Toaster() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const mode = isDark ? 'dark' : 'light';
  const c = SURFACE[mode];

  return (
    <SonnerToaster
      position="top-center"
      offset={insets.top + 8}
      theme={mode}
      richColors={false}
      swipeToDismissDirection="up"
      icons={{
        success: <CircleCheck size={ICON} color={ACCENT.success[mode]} />,
        error: <CircleX size={ICON} color={ACCENT.error[mode]} />,
        warning: <TriangleAlert size={ICON} color={ACCENT.warning[mode]} />,
        info: <Info size={ICON} color={ACCENT.info[mode]} />,
        loading: <Spinner size={ICON} className="text-muted-foreground" />,
      }}
      toastOptions={{
        style: {
          backgroundColor: c.card,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        titleStyle: { color: c.fg, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
        descriptionStyle: { color: c.muted, fontFamily: 'Inter_400Regular', fontSize: 13 },
      }}
    />
  );
}

export { Toaster, toast };
