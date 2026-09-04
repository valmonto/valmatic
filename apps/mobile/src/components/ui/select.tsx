import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as SelectPrimitive from '@rn-primitives/select';
import { BlurView } from 'expo-blur';
import { Check, ChevronDown, ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

type Option = SelectPrimitive.Option;

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

function SelectValue({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value> & {
  className?: string;
}) {
  const { value } = SelectPrimitive.useRootContext();
  return (
    <SelectPrimitive.Value
      ref={ref}
      className={cn(
        'text-foreground line-clamp-1 flex flex-row items-center gap-2 text-sm',
        !value && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function SelectTrigger({
  ref,
  className,
  children,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  children?: React.ReactNode;
  size?: 'default' | 'sm';
}) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'border-border bg-card flex h-12 flex-row items-center justify-between gap-2 rounded-2xl border px-3.5 shadow-sm shadow-black/5',
        Platform.select({
          web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-fit whitespace-nowrap text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0',
        }),
        props.disabled && 'opacity-50',
        size === 'sm' && 'h-10',
        className,
      )}
      {...props}
    >
      <>{children}</>
      <Icon as={ChevronDown} aria-hidden={true} className="text-muted-foreground size-4" />
    </SelectPrimitive.Trigger>
  );
}

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

/** Frosted glass surface for the dropdown panel (matches Popover / the menus). */
function SelectGlass({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }
  return (
    <BlurView
      intensity={isDark ? 60 : 80}
      tint={isDark ? 'dark' : 'light'}
      blurMethod="dimezisBlurView"
    >
      <View style={{ backgroundColor: isDark ? 'rgba(24,24,30,0.94)' : 'rgba(255,255,255,0.95)' }}>
        {children}
      </View>
    </BlurView>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  portalHost,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  className?: string;
  portalHost?: string;
}) {
  // Match the panel width to the trigger on native so it lines up (web uses a CSS var).
  const { triggerPosition } = SelectPrimitive.useRootContext();
  const nativeWidth =
    Platform.OS !== 'web' && triggerPosition?.width ? { width: triggerPosition.width } : undefined;
  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <SelectPrimitive.Overlay
          style={Platform.select({ native: StyleSheet.absoluteFill })}
          asChild={Platform.OS !== 'web'}
        >
          <NativeOnlyAnimatedView
            className="z-50"
            entering={FadeIn.reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.reduceMotion(ReduceMotion.System)}
            as="Pressable"
          >
            <TextClassContext.Provider value="text-popover-foreground">
              <SelectPrimitive.Content
                className={cn(
                  'border-border relative z-50 min-w-[8rem] overflow-hidden rounded-2xl border shadow-lg shadow-black/20',
                  Platform.select({
                    web: cn(
                      'bg-popover animate-in fade-in-0 zoom-in-95 origin-(--radix-select-content-transform-origin) max-h-52 overflow-y-auto overflow-x-hidden',
                      props.side === 'bottom' && 'slide-in-from-top-2',
                      props.side === 'top' && 'slide-in-from-bottom-2',
                    ),
                  }),
                  position === 'popper' &&
                    Platform.select({
                      web: cn(
                        props.side === 'bottom' && 'translate-y-1',
                        props.side === 'top' && '-translate-y-1',
                      ),
                    }),
                  className,
                )}
                position={position}
                style={nativeWidth}
                {...props}
              >
                <SelectGlass>
                  <SelectScrollUpButton />
                  <SelectPrimitive.Viewport
                    className={cn(
                      'p-1.5',
                      position === 'popper' &&
                        cn(
                          'w-full',
                          Platform.select({
                            web: 'h-[var(--radix-select-trigger-height)] min-w-[var(--radix-select-trigger-width)]',
                          }),
                        ),
                    )}
                  >
                    {children}
                  </SelectPrimitive.Viewport>
                  <SelectScrollDownButton />
                </SelectGlass>
              </SelectPrimitive.Content>
            </TextClassContext.Provider>
          </NativeOnlyAnimatedView>
        </SelectPrimitive.Overlay>
      </FullWindowOverlay>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('text-muted-foreground px-2.5 py-1.5 text-xs font-medium', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'active:bg-accent group relative flex w-full flex-row items-center gap-2 rounded-lg py-2.5 pl-2.5 pr-8',
        Platform.select({
          web: 'focus:bg-accent focus:text-accent-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 cursor-default outline-none data-[disabled]:pointer-events-none [&_svg]:pointer-events-none',
        }),
        props.disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <View className="absolute right-2.5 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon as={Check} className="text-primary size-4 shrink-0" />
        </SelectPrimitive.ItemIndicator>
      </View>
      <SelectPrimitive.ItemText className="text-foreground group-active:text-accent-foreground select-none text-sm" />
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn(
        'bg-border -mx-1 my-1 h-px',
        Platform.select({ web: 'pointer-events-none' }),
        className,
      )}
      {...props}
    />
  );
}

/**
 * @platform Web only
 * Returns null on native platforms
 */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  if (Platform.OS !== 'web') {
    return null;
  }
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <Icon as={ChevronUpIcon} className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

/**
 * @platform Web only
 * Returns null on native platforms
 */
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  if (Platform.OS !== 'web') {
    return null;
  }
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <Icon as={ChevronDownIcon} className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type Option,
};
