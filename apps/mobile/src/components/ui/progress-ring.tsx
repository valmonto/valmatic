import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useThemeColors } from '@/shared/lib/theme-colors';
import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ProgressRingProps = {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Center content — defaults to the rounded percentage. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * A circular progress ring (usage quota, goal, upload %). `bg-primary`-hued arc
 * over a muted track; percentage in the center by default.
 */
function ProgressRing({ value, size = 96, strokeWidth = 8, children, className }: ProgressRingProps) {
  const colors = useThemeColors();
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <View className={cn('items-center justify-center', className)} style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children ?? (
        <Text className="text-lg font-semibold tabular-nums text-foreground">{Math.round(pct)}%</Text>
      )}
    </View>
  );
}

export { ProgressRing };
export type { ProgressRingProps };
