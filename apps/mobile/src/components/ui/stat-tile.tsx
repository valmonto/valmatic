import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

// Reserved status hues for the delta (paired with an arrow icon, so change is
// never color-alone). Text/label stay in ink tokens per dataviz guidance.
const DELTA_TONE = {
  positive: 'text-green-600 dark:text-green-500',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
} as const;

type StatTileProps = {
  label: string;
  value: string;
  /** Small icon shown top-right. */
  icon?: LucideIcon;
  /** Change value, e.g. "12.5%". */
  delta?: string;
  deltaDirection?: 'up' | 'down';
  /** Color of the delta. Defaults from direction (up→positive, down→negative). */
  deltaTone?: keyof typeof DELTA_TONE;
  /** Sub-caption, e.g. "vs last month". */
  caption?: string;
  className?: string;
};

/**
 * A dashboard KPI tile: label, a big headline value, and an optional
 * arrow+delta with a reserved status color. Ink text tokens; the delta's color
 * is backed by an icon so it reads without color.
 */
function StatTile({
  label,
  value,
  icon,
  delta,
  deltaDirection,
  deltaTone,
  caption,
  className,
}: StatTileProps) {
  const tone: keyof typeof DELTA_TONE =
    deltaTone ?? (deltaDirection === 'down' ? 'negative' : 'positive');
  const toneClass = DELTA_TONE[tone];
  const arrow = deltaDirection === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <View className={cn('border-border bg-card gap-3 rounded-2xl border p-4', className)}>
      <View className="flex-row items-center justify-between">
        <Text variant="muted" className="text-sm" numberOfLines={1}>
          {label}
        </Text>
        {icon ? <Icon as={icon} size={16} className="text-muted-foreground" /> : null}
      </View>

      <View className="gap-1">
        <Text className="text-2xl font-semibold tabular-nums text-foreground">{value}</Text>
        {delta || caption ? (
          <View className="flex-row items-center gap-1.5">
            {delta ? (
              <View className="flex-row items-center gap-0.5">
                {deltaDirection ? <Icon as={arrow} size={14} className={toneClass} /> : null}
                <Text className={cn('text-xs font-medium tabular-nums', toneClass)}>{delta}</Text>
              </View>
            ) : null}
            {caption ? (
              <Text variant="muted" className="text-xs">
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export { StatTile };
export type { StatTileProps };
