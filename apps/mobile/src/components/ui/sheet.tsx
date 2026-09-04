import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 24, stiffness: 240, mass: 0.7 };

interface SheetProps {
  /** Element that opens the sheet (rendered via `onPress`). Optional if controlled. */
  trigger?: React.ReactElement<{ onPress?: () => void }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Footer actions pinned below the content. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * A themed, gesture-driven bottom sheet: glass surface with a grab handle,
 * drag/swipe-to-dismiss, backdrop-tap close, and content height (capped at 90%).
 */
function Sheet({ trigger, open, onOpenChange, title, description, footer, children }: SheetProps) {
  const { colorScheme } = useColorScheme();
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const tint = isDark ? 'rgba(22,22,27,0.98)' : 'rgba(255,255,255,0.98)';
  const portalName = React.useId();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const [rendered, setRendered] = React.useState(isOpen);

  const translateY = useSharedValue(2000);
  const sheetH = React.useRef(0);
  const didEnter = React.useRef(false);

  const finishClose = React.useCallback(() => {
    didEnter.current = false;
    sheetH.current = 0;
    setRendered(false);
    if (open === undefined) setInternalOpen(false);
    onOpenChange?.(false);
  }, [open, onOpenChange]);

  const animateOut = React.useCallback(() => {
    translateY.value = withTiming(winH, { duration: 220 }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(finishClose);
    });
  }, [winH, finishClose, translateY]);

  React.useEffect(() => {
    if (isOpen) setRendered(true);
    else if (rendered) animateOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onPanelLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    sheetH.current = h;
    if (!didEnter.current && h > 0) {
      didEnter.current = true;
      translateY.value = h;
      translateY.value = withSpring(0, SPRING);
    }
  };

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > 120 || e.velocityY > 900) {
            translateY.value = withTiming(winH, { duration: 220 }, (finished) => {
              'worklet';
              if (finished) scheduleOnRN(finishClose);
            });
          } else {
            translateY.value = withSpring(0, SPRING);
          }
        }),
    [winH, finishClose, translateY],
  );

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => {
    const h = sheetH.current || winH;
    const p = 1 - Math.min(1, Math.max(0, translateY.value / h));
    return { opacity: p * 0.5 };
  });

  const openSheet = () => {
    if (open === undefined) setInternalOpen(true);
    onOpenChange?.(true);
  };

  return (
    <>
      {trigger ? React.cloneElement(trigger, { onPress: openSheet }) : null}
      {rendered ? (
        <Portal name={portalName}>
          <FullWindowOverlay>
            <View style={StyleSheet.absoluteFill}>
              <AnimatedPressable
                onPress={animateOut}
                style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}
              />
              <View
                pointerEvents="box-none"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
              >
                <Animated.View
                  onLayout={onPanelLayout}
                  style={[panelStyle, { maxHeight: winH * 0.9, backgroundColor: tint }]}
                  className="border-border overflow-hidden rounded-t-3xl border-t"
                >
                  {/* Liquid-glass sheen (subtle in dark). */}
                  <LinearGradient
                    pointerEvents="none"
                    colors={
                      isDark
                        ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']
                        : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']
                    }
                    locations={[0, 0.22]}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Drag zone: grab handle + header. */}
                  <GestureDetector gesture={pan}>
                    <View className="px-5 pt-2.5">
                      <View className="bg-muted-foreground/30 mx-auto h-1 w-10 rounded-full" />
                      {title || description ? (
                        <View className="gap-0.5 pb-3 pt-3">
                          {title ? (
                            <Text className="text-base font-semibold text-foreground">{title}</Text>
                          ) : null}
                          {description ? (
                            <Text className="text-sm text-muted-foreground">{description}</Text>
                          ) : null}
                        </View>
                      ) : (
                        <View className="pb-1" />
                      )}
                    </View>
                  </GestureDetector>

                  {/* Content (scrolls if tall). */}
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 20,
                      paddingTop: 4,
                      paddingBottom: footer ? 8 : insets.bottom + 16,
                    }}
                  >
                    {children}
                  </ScrollView>

                  {footer ? (
                    <View
                      className="border-border/60 flex-row justify-end gap-2 border-t px-5 pt-4"
                      style={{ paddingBottom: insets.bottom + 12 }}
                    >
                      {footer}
                    </View>
                  ) : null}
                </Animated.View>
              </View>
            </View>
          </FullWindowOverlay>
        </Portal>
      ) : null}
    </>
  );
}

export { Sheet };
export type { SheetProps };
