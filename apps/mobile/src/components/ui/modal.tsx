import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { LinearGradient } from 'expo-linear-gradient';
import { X, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

export type ModalVariant = 'default' | 'fullscreen';

interface ModalProps {
  /** Element that opens the modal (rendered via `asChild`). */
  trigger?: React.ReactNode;
  variant?: ModalVariant;
  /** Optional leading icon shown in a tonal chip beside the title. */
  icon?: LucideIcon;
  title?: string;
  description?: string;
  /** Footer actions (e.g. Cancel / Save) — pinned below the scroll area. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function CloseButton() {
  return (
    <DialogPrimitive.Close hitSlop={12} className="rounded-full p-1 opacity-70 active:opacity-100">
      <Icon as={X} size={20} className="text-foreground" />
      <Text className="sr-only">Close</Text>
    </DialogPrimitive.Close>
  );
}

/**
 * A glass modal with two presentations:
 * - `default`   — centered card; header + footer stay pinned, the body scrolls.
 * - `fullscreen` — bottom sheet that slides up and fills the screen; same pinned
 *   header/footer with a scrolling body.
 */
function Modal({
  trigger,
  variant = 'default',
  icon,
  title,
  description,
  footer,
  children,
  open,
  onOpenChange,
}: ModalProps) {
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isDark = colorScheme === 'dark';
  const fullscreen = variant === 'fullscreen';
  // Fairly opaque so page content can't ghost through the pinned header (the
  // sheet fully covers what's behind it; the blur is just a subtle frost).
  const tint = isDark ? 'rgba(22,22,27,0.96)' : 'rgba(255,255,255,0.97)';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <FullWindowOverlay>
          <ModalOverlay fullscreen={fullscreen} width={width} height={height}>
            <NativeOnlyAnimatedView
              // Sheet slides up/down; centered card scales in/out (collapses away
              // on close, which avoids the washed-out look of a plain opacity fade).
              entering={(fullscreen ? SlideInDown : ZoomIn)
                .duration(fullscreen ? 260 : 190)
                .reduceMotion(ReduceMotion.System)}
              exiting={(fullscreen ? SlideOutDown : ZoomOut)
                .duration(fullscreen ? 200 : 150)
                .reduceMotion(ReduceMotion.System)}
              style={
                fullscreen
                  ? { width, height: height * 0.92 }
                  : { width: width - 40, maxWidth: 520, maxHeight: height * 0.82 }
              }
              className={cn(
                'border-border overflow-hidden border',
                fullscreen ? 'rounded-t-3xl' : 'rounded-3xl'
              )}>
              {/* No BlurView here: the panel floats over a dark dimmed scrim, so
                  the blur just picks up black (invisible under the near-opaque
                  tint) and — worse — flashes dark while its opacity animates out
                  on Android. A solid tint + the liquid sheen gives the same look
                  without the flash. */}
              <View style={{ backgroundColor: tint }} className={fullscreen ? 'flex-1' : ''}>
                {/* Liquid-glass: a soft specular sheen from the top + a bright rim
                    on the top edge. Kept very subtle in dark (a strong white sheen
                    over a dark panel just reads as a muddy haze). */}
                <LinearGradient
                  pointerEvents="none"
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']
                      : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']
                  }
                  locations={isDark ? [0, 0.22] : [0, 0.18, 0.5]}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: StyleSheet.hairlineWidth * 2,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)',
                  }}
                />
                {/* Header (pinned) */}
                <View className="flex-row items-start gap-3 border-b border-border/60 px-5 pb-4 pt-5">
                  {icon ? (
                    <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon as={icon} size={18} className="text-primary" />
                    </View>
                  ) : null}
                  <View className="flex-1 gap-0.5 pt-0.5">
                    {title ? (
                      <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                        {title}
                      </DialogPrimitive.Title>
                    ) : null}
                    {description ? (
                      <DialogPrimitive.Description className="text-sm text-muted-foreground">
                        {description}
                      </DialogPrimitive.Description>
                    ) : null}
                  </View>
                  <CloseButton />
                </View>

                {/* Body (scrolls) with fade hints top/bottom */}
                <View className="relative" style={fullscreen ? { flex: 1 } : { flexShrink: 1 }}>
                  <ScrollView
                    style={fullscreen ? { flex: 1 } : undefined}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                    {children}
                  </ScrollView>
                  <LinearGradient
                    pointerEvents="none"
                    colors={[tint, 'rgba(0,0,0,0)']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16 }}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(0,0,0,0)', tint]}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16 }}
                  />
                </View>

                {/* Footer (pinned) */}
                {footer ? (
                  <View className="flex-row justify-end gap-2 border-t border-border/60 px-5 py-4">
                    {footer}
                  </View>
                ) : null}
              </View>
            </NativeOnlyAnimatedView>
          </ModalOverlay>
        </FullWindowOverlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ModalOverlay({
  fullscreen,
  width,
  height,
  children,
}: {
  fullscreen: boolean;
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  // Deliberately NO backdrop-tap-to-close: a content modal shouldn't dismiss on
  // an accidental outside touch (a stray Pressable here also stole the sheet's
  // scroll gesture). Close only via the ✕ / footer actions / hardware back.
  return (
    <DialogPrimitive.Overlay
      // The primitive Overlay is a Pressable that closes on tap by default —
      // disable it so a stray outside touch can't dismiss a content modal.
      closeOnPress={false}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        alignItems: 'center',
        justifyContent: fullscreen ? 'flex-end' : 'center',
      }}>
      {/* Scrim fades in/out with the panel — as its own animated layer, so the
          panel doesn't fade away first and leave the dark backdrop lingering. */}
      <NativeOnlyAnimatedView
        entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
      />
      {children}
    </DialogPrimitive.Overlay>
  );
}

const ModalClose = DialogPrimitive.Close;

export { Modal, ModalClose };
