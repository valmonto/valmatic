import { Icon } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SpinnerProps = {
  /** Diameter in px. */
  size?: number;
  /** Color/utility classes. Defaults to the inherited text color, else muted. */
  className?: string;
  /** Milliseconds per full rotation. */
  duration?: number;
  /** Swap the spinning glyph (any Lucide icon with a circular/arc shape). */
  as?: LucideIcon;
};

/**
 * A continuously rotating loading indicator. Inherits its color from the nearest
 * `TextClassContext` (so it turns white inside a solid Button, etc.), falling back
 * to `text-muted-foreground` when used standalone.
 */
function Spinner({ size = 20, className, duration = 800, as = Loader2 }: SpinnerProps) {
  const textClass = React.useContext(TextClassContext);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1, // infinite
      false,
    );
    return () => cancelAnimation(rotation);
  }, [duration, rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={style} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Icon as={as} size={size} className={cn('text-muted-foreground', textClass, className)} />
    </Animated.View>
  );
}

export { Spinner };
export type { SpinnerProps };
