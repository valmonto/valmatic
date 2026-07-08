import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { Platform, View } from 'react-native';

const badgeVariants = cva(
  cn(
    'border-border group shrink-0 flex-row items-center justify-center gap-1.5 overflow-hidden rounded-full border px-3 py-1',
    Platform.select({
      web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-fit whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
    }),
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary border-transparent',
          Platform.select({ web: '[a&]:hover:bg-primary/90' }),
        ),
        secondary: cn(
          'bg-secondary border-transparent',
          Platform.select({ web: '[a&]:hover:bg-secondary/90' }),
        ),
        destructive: cn(
          'bg-destructive border-transparent',
          Platform.select({ web: '[a&]:hover:bg-destructive/90' }),
        ),
        outline: Platform.select({ web: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground' }),
        // Soft tonal status variants (semantic hues, dark-aware — same convention
        // as Alert). `destructive` stays on the theme token; these are meaning-colors.
        success: 'border-transparent bg-emerald-500/15 dark:bg-emerald-400/15',
        warning: 'border-transparent bg-amber-500/15 dark:bg-amber-400/15',
        info: 'border-transparent bg-blue-500/15 dark:bg-blue-400/15',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const badgeTextVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      success: 'text-emerald-700 dark:text-emerald-300',
      warning: 'text-amber-700 dark:text-amber-300',
      info: 'text-blue-700 dark:text-blue-300',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = React.ComponentProps<typeof View> &
  React.RefAttributes<View> & {
    asChild?: boolean;
  } & VariantProps<typeof badgeVariants>;

// Solid variants have an opaque fill that would hide the blur, so only the
// translucent variants get the frosted glass backing.
const SOLID_VARIANTS = new Set([undefined, 'default', 'destructive']);

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const Component = asChild ? Slot : View;
  const badge = <Component className={cn(badgeVariants({ variant }), className)} {...props} />;
  const glass = !asChild && Platform.OS !== 'web' && !SOLID_VARIANTS.has(variant ?? undefined);
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      {glass ? (
        <BlurView
          // Strong frost + a neutral scrim so the chip stays legible over any
          // photo (a light blur alone is too see-through for a small element).
          intensity={isDark ? 55 : 75}
          tint={isDark ? 'dark' : 'light'}
          blurMethod="dimezisBlurView"
          className="self-start overflow-hidden rounded-full">
          <View style={{ backgroundColor: isDark ? 'rgba(20,20,24,0.35)' : 'rgba(255,255,255,0.45)' }}>
            {badge}
          </View>
        </BlurView>
      ) : (
        badge
      )}
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
