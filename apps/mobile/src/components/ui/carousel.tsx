import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type CarouselProps<T> = {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Placeholder height used before the container is measured. */
  height?: number;
  /** Px of the adjacent cards left peeking on each side. */
  peek?: number;
  /** Gap between cards. */
  gap?: number;
  showDots?: boolean;
  className?: string;
};

/**
 * A snapping horizontal carousel with a peek of the neighbouring cards and
 * synced pagination dots. Scrolling runs on the UI thread (Reanimated) and only
 * pushes an index update to JS when the page changes — smooth inside a vertical
 * scroll view. Token-styled dots; you render the cards.
 */
function Carousel<T>({
  data,
  renderItem,
  height = 176,
  peek = 24,
  gap = 12,
  showDots = true,
  className,
}: CarouselProps<T>) {
  const [containerW, setContainerW] = React.useState(0);
  const [index, setIndex] = React.useState(0);

  const cardW = containerW > 0 ? containerW - peek * 2 : 0;
  const interval = cardW + gap;
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  useAnimatedReaction(
    () => (interval > 0 ? Math.round(scrollX.value / interval) : 0),
    (curr, prev) => {
      if (curr !== prev) {
        scheduleOnRN(setIndex, Math.min(data.length - 1, Math.max(0, curr)));
      }
    },
    [interval, data.length],
  );

  const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);

  return (
    <View className={cn('w-full gap-3', className)} onLayout={onLayout}>
      {containerW > 0 ? (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: peek }}
        >
          {data.map((item, i) => (
            <View key={i} style={{ width: cardW, marginRight: i < data.length - 1 ? gap : 0 }}>
              {renderItem(item, i)}
            </View>
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={{ height }} />
      )}

      {showDots ? (
        <View className="flex-row items-center justify-center gap-1.5">
          {data.map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-2 rounded-full',
                i === index ? 'bg-primary w-5' : 'bg-muted-foreground/30 w-2',
              )}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export { Carousel };
export type { CarouselProps };
