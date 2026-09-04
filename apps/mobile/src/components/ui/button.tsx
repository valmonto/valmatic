import { Spinner } from '@/components/ui/spinner';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-lg shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' }),
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90 shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          }),
        ),
        outline: cn(
          // `input`/`border` are already alpha tokens in dark, so use them as-is
          // (no /opacity override, which would blow them out to a bright gray).
          'border-border bg-background active:bg-accent dark:border-input dark:bg-input dark:active:bg-accent border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50',
          }),
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 border border-border shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/80' }),
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' }),
        ),
        link: '',
      },
      size: {
        default: cn('h-10 px-4 py-2 sm:h-9', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-9 gap-1.5 px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-11 px-6 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-10 w-10 sm:h-9 sm:w-9',
        'icon-sm': 'h-9 w-9 sm:h-8 sm:w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' }),
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' }),
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' }),
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
        'icon-sm': '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    /** Show a spinner and block presses while an async action runs. */
    loading?: boolean;
  };

// Solid variants get a subtle top-highlight → bottom-shade sheen so they read as
// dimensional rather than flat (the native take on the web button's gradient).
const SHEEN_VARIANTS = new Set(['default', 'destructive', 'secondary', undefined]);

function Button({
  className,
  variant,
  size,
  children,
  loading,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const showSheen = SHEEN_VARIANTS.has(variant ?? undefined);
  const isDisabled = disabled || loading;
  // Springy scale-down on press + a light haptic tick — the satisfying native
  // "physical key" feel. The scale lives on a wrapper so the Pressable keeps its
  // NativeWind className (animated components don't get className processed).
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withTiming(0.96, { duration: 80 });
    if (!isDisabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPressIn?.(e);
  };
  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 320, mass: 0.5 });
    onPressOut?.(e);
  };

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Animated.View style={animatedStyle}>
        <Pressable
          className={cn(isDisabled && 'opacity-50', buttonVariants({ variant, size }), className)}
          role="button"
          disabled={isDisabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...props}
        >
          {(state) => (
            <>
              {showSheen ? (
                <LinearGradient
                  colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.10)']}
                  locations={[0, 0.46, 1]}
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              {loading ? <Spinner size={16} /> : null}
              {typeof children === 'function' ? children(state) : (children as ReactNode)}
            </>
          )}
        </Pressable>
      </Animated.View>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
