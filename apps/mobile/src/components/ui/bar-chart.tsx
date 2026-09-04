import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

type BarDatum = { label: string; value: number };

type BarChartProps = {
  data: BarDatum[];
  height?: number;
  /** Show the value above each bar. */
  showValues?: boolean;
  className?: string;
};

/**
 * A single-series bar chart built from Views (no charting dep). Token `bg-primary`
 * bars with rounded tops anchored to the baseline; ink labels underneath — the
 * dataviz spec for a simple magnitude chart.
 */
function BarChart({ data, height = 160, showValues, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View className={cn('w-full gap-2', className)}>
      <View className="flex-row items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <View key={i} className="flex-1 items-center justify-end gap-1">
            {showValues ? (
              <Text className="text-[11px] font-medium tabular-nums text-foreground">
                {d.value}
              </Text>
            ) : null}
            <View
              className="bg-primary w-full rounded-t-md"
              style={{ height: Math.max(2, (d.value / max) * (height - (showValues ? 18 : 0))) }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row gap-2">
        {data.map((d, i) => (
          <Text key={i} numberOfLines={1} variant="muted" className="flex-1 text-center text-xs">
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export { BarChart };
export type { BarChartProps, BarDatum };
