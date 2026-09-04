import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type SliderProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
};

const THUMB = 22;
const TRACK_H = 6;

/**
 * A themed, gesture-driven slider (drag the thumb or tap the track). On-brand:
 * `bg-muted` track, `bg-primary` fill, a `bg-card` thumb ringed in primary.
 */
function Slider({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className,
}: SliderProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;
  const [trackW, setTrackW] = React.useState(0);

  // Travel available to the thumb centre (inset by the thumb radius so it never clips).
  const usable = Math.max(0, trackW - THUMB);

  const clampToStep = React.useCallback(
    (v: number) => {
      const c = Math.min(max, Math.max(min, v));
      const stepped = Math.round((c - min) / step) * step + min;
      return Math.min(max, Math.max(min, stepped));
    },
    [min, max, step],
  );

  const commit = React.useCallback(
    (next: number) => {
      const v = clampToStep(next);
      if (value == null) setInternal(v);
      onValueChange?.(v);
    },
    [clampToStep, onValueChange, value],
  );

  // Shared value = thumb-centre offset in px (0..usable).
  const posX = useSharedValue(0);
  const pct = max > min ? (current - min) / (max - min) : 0;
  React.useEffect(() => {
    posX.value = pct * usable;
  }, [pct, usable, posX]);

  const setFromX = React.useCallback(
    (x: number) => {
      if (usable <= 0) return;
      const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
      commit(min + ratio * (max - min));
    },
    [usable, commit, min, max],
  );

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        // Move the thumb on the UI thread for immediate feedback; report the
        // (step-snapped) value back to JS. onBegin also handles tap-to-set.
        .onBegin((e) => {
          posX.set(Math.min(usable, Math.max(0, e.x - THUMB / 2)));
          scheduleOnRN(setFromX, e.x);
        })
        .onChange((e) => {
          posX.set(Math.min(usable, Math.max(0, e.x - THUMB / 2)));
          scheduleOnRN(setFromX, e.x);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, usable, setFromX],
  );

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: posX.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: posX.value + THUMB / 2 }));

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={onLayout}
        className={cn('w-full justify-center', disabled && 'opacity-50', className)}
        style={{ height: THUMB }}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        {/* Track */}
        <View className="bg-muted w-full rounded-full" style={{ height: TRACK_H }} />
        {/* Fill */}
        <Animated.View
          className="bg-primary absolute rounded-full"
          style={[{ height: TRACK_H, left: 0 }, fillStyle]}
        />
        {/* Thumb */}
        <Animated.View
          className="border-primary bg-card absolute rounded-full border-2 shadow-sm shadow-black/20"
          style={[{ width: THUMB, height: THUMB, left: 0 }, thumbStyle]}
        />
      </View>
    </GestureDetector>
  );
}

export { Slider };
export type { SliderProps };
