import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as Haptics from 'expo-haptics';
import { type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type FabProps = React.ComponentProps<typeof Pressable> & {
  icon: LucideIcon;
  /** Optional label — renders an extended (pill) FAB. */
  label?: string;
};

/**
 * A floating action button — the persistent primary action ("+ New"). Position
 * it yourself via `className` (e.g. `absolute bottom-6 right-6`). Springy press +
 * haptic, like Button.
 */
function Fab({ icon, label, className, onPressIn, onPressOut, ...props }: FabProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.set(withTiming(0.92, { duration: 80 }));
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPressIn?.(e);
  };
  const handlePressOut = (e: GestureResponderEvent) => {
    scale.set(withSpring(1, { damping: 14, stiffness: 320, mass: 0.5 }));
    onPressOut?.(e);
  };

  return (
    <Animated.View style={animatedStyle} className={cn('absolute bottom-6 right-6', className)}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        className={cn(
          'bg-primary flex-row items-center justify-center gap-2 shadow-lg shadow-black/30',
          label ? 'h-14 rounded-full px-5' : 'size-14 rounded-full',
        )}
        {...props}
      >
        <Icon as={icon} size={24} className="text-primary-foreground" />
        {label ? (
          <Text className="text-primary-foreground text-base font-semibold">{label}</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export { Fab };
export type { FabProps };
