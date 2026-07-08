import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as PopoverPrimitive from '@rn-primitives/popover';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  portalHost,
  children,
  insets,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
    portalHost?: string;
  }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const edgeInsets = insets ?? { top: 12, bottom: 12, left: 12, right: 12 };
  return (
    <PopoverPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <PopoverPrimitive.Overlay
          style={Platform.select({ native: StyleSheet.absoluteFill })}
          asChild={Platform.OS !== 'web'}>
          <NativeOnlyAnimatedView
            entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.reduceMotion(ReduceMotion.System)}
            as="Pressable">
            <TextClassContext.Provider value="text-popover-foreground">
              {/* Frosted glass card (matches Card / the other overlays). */}
              <PopoverPrimitive.Content
                align={align}
                sideOffset={sideOffset}
                insets={edgeInsets}
                className={cn(
                  'border-border outline-hidden z-50 w-80 overflow-hidden rounded-2xl border shadow-lg shadow-black/20',
                  Platform.select({
                    web: cn(
                      'bg-popover p-4 animate-in fade-in-0 zoom-in-95 origin-(--radix-popover-content-transform-origin) cursor-auto',
                      props.side === 'bottom' && 'slide-in-from-top-2',
                      props.side === 'top' && 'slide-in-from-bottom-2'
                    ),
                  }),
                  className
                )}
                {...props}>
                {Platform.OS === 'web' ? (
                  children
                ) : (
                  <BlurView
                    intensity={isDark ? 60 : 80}
                    tint={isDark ? 'dark' : 'light'}
                    blurMethod="dimezisBlurView">
                    {/* Fairly opaque: on Android a portaled BlurView often can't
                        sample what's behind it, so without this the translucent
                        tint lets page content bleed through (distracting under a
                        dense panel like the calendar). */}
                    <View
                      className="p-4"
                      style={{ backgroundColor: isDark ? 'rgba(24,24,30,0.94)' : 'rgba(255,255,255,0.95)' }}>
                      {children as React.ReactNode}
                    </View>
                  </BlurView>
                )}
              </PopoverPrimitive.Content>
            </TextClassContext.Provider>
          </NativeOnlyAnimatedView>
        </PopoverPrimitive.Overlay>
      </FullWindowOverlay>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
