import { buttonTextVariants, buttonVariants } from '@/components/ui/button';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, useWindowDimensions, View, type ViewProps } from 'react-native';
import { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function AlertDialogOverlay({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  // The scrim is a real RN View (asChild off) so its inline style is honored —
  // NativeWind can't reach the runtime-wrapped animated Pressable, and the
  // portal host isn't full-screen on Android, so we size the overlay explicitly.
  return (
    <FullWindowOverlay>
      <AlertDialogPrimitive.Overlay
        className={cn(
          Platform.select({
            web: 'animate-in fade-in-0 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6',
          }),
          className,
        )}
        {...props}
        style={Platform.select({
          native: {
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        })}
      >
        <NativeOnlyAnimatedView
          entering={FadeIn.duration(200).delay(50).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
          as="View"
        >
          {children}
        </NativeOnlyAnimatedView>
      </AlertDialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

function AlertDialogContent({
  className,
  portalHost,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  portalHost?: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        {/* Glass panel: a frosted BlurView floating over the dimmed backdrop. */}
        <AlertDialogPrimitive.Content
          className={cn(
            'border-border z-50 w-full max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl border sm:max-w-lg',
            Platform.select({
              web: 'animate-in fade-in-0 zoom-in-95 duration-200',
            }),
            className,
          )}
          style={{ boxShadow: '0px 16px 48px -12px rgba(0,0,0,0.45)' }}
          {...props}
        >
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            blurMethod="dimezisBlurView"
          >
            {/* Higher tint opacity than a plain Card: the panel floats over the
                dark scrim, so it needs more opaque frost to stay a clean surface
                (otherwise the blur samples the backdrop and reads gray). */}
            <View
              className="flex flex-col gap-5 p-6"
              style={{ backgroundColor: isDark ? 'rgba(28,28,34,0.82)' : 'rgba(255,255,255,0.82)' }}
            >
              {children}
            </View>
          </BlurView>
        </AlertDialogPrimitive.Content>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: ViewProps) {
  return (
    <TextClassContext.Provider value="text-center sm:text-left">
      <View className={cn('flex flex-col gap-2', className)} {...props} />
    </TextClassContext.Provider>
  );
}

function AlertDialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-foreground text-lg font-semibold', className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ className })}>
      <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />
    </TextClassContext.Provider>
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ className, variant: 'outline' })}>
      <AlertDialogPrimitive.Cancel
        className={cn(buttonVariants({ variant: 'outline' }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
