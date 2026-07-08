import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { cn } from '@/shared/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function DialogOverlay({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  const { onOpenChange } = DialogPrimitive.useRootContext();
  const { width, height } = useWindowDimensions();

  function onOverlayPress(event: GestureResponderEvent) {
    onPress?.(event);
    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {
      onOpenChange(false);
    }
  }

  return (
    <FullWindowOverlay>
      {/* Real View scrim sized from window dims (same reason as AlertDialog:
          NativeWind can't dim the animated Pressable, and inset-0 collapses in
          the Android portal). A full-screen Pressable behind the content closes
          the dialog on backdrop tap. */}
      <DialogPrimitive.Overlay
        className={cn(
          Platform.select({
            web: 'animate-in fade-in-0 fixed inset-0 flex items-center justify-center bg-black/50 p-4 cursor-default [&>*]:cursor-auto',
          }),
          className
        )}
        {...props}
        onPress={Platform.select({ web: onOverlayPress })}
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
        })}>
        {Platform.OS === 'web' ? (
          <>{children}</>
        ) : (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
            <NativeOnlyAnimatedView
              entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}>
              <>{children}</>
            </NativeOnlyAnimatedView>
          </>
        )}
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}
function DialogContent({
  className,
  portalHost,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const closeButton = (
    <DialogPrimitive.Close
      className={cn(
        'absolute right-4 top-4 rounded opacity-70 active:opacity-100',
        Platform.select({
          web: 'ring-offset-background focus:ring-ring data-[state=open]:bg-accent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2',
        })
      )}
      hitSlop={12}>
      <Icon as={X} className={cn('text-foreground web:pointer-events-none size-5 shrink-0')} />
      <Text className="sr-only">Close</Text>
    </DialogPrimitive.Close>
  );

  return (
    <DialogPortal hostName={portalHost}>
      <DialogOverlay>
        {/* Glass panel over the dimmed backdrop (matches AlertDialog). */}
        <DialogPrimitive.Content
          className={cn(
            'border-border z-50 mx-auto w-full max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl border sm:max-w-lg',
            Platform.select({
              web: 'bg-background flex flex-col gap-4 p-6 animate-in fade-in-0 zoom-in-95 duration-200',
            }),
            className
          )}
          style={{ boxShadow: '0px 16px 48px -12px rgba(0,0,0,0.45)' }}
          {...props}>
          {Platform.OS === 'web' ? (
            <>
              {children}
              {closeButton}
            </>
          ) : (
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              blurMethod="dimezisBlurView">
              <View
                className="flex flex-col gap-4 p-6"
                style={{
                  backgroundColor: isDark ? 'rgba(28,28,34,0.82)' : 'rgba(255,255,255,0.82)',
                }}>
                {children}
                {closeButton}
              </View>
            </BlurView>
          )}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ViewProps) {
  return (
    <View className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-foreground text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
