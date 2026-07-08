import { Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Moon, Sun } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';

/**
 * Small sun/moon toggle so the showcase can be checked in both themes without
 * bouncing back to the Profile screen. Drives NativeWind's colour scheme.
 */
export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <Pressable
      onPress={toggleColorScheme}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-9 w-9 items-center justify-center rounded-full border border-border bg-card active:opacity-70">
      <Icon as={isDark ? Sun : Moon} size={16} className="text-foreground" />
    </Pressable>
  );
}
