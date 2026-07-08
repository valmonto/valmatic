import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

const TONE = {
  primary: { chip: 'bg-primary', icon: 'text-primary-foreground', dot: 'bg-primary' },
  muted: { chip: 'bg-muted', icon: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  success: { chip: 'bg-green-500/15', icon: 'text-green-600 dark:text-green-500', dot: 'bg-green-500' },
  warning: { chip: 'bg-amber-500/15', icon: 'text-amber-600 dark:text-amber-500', dot: 'bg-amber-500' },
  destructive: { chip: 'bg-destructive/10', icon: 'text-destructive', dot: 'bg-destructive' },
} as const;

type TimelineItem = {
  title: string;
  description?: string;
  time?: string;
  /** Icon rendered in a tonal node chip; omit for a small dot. */
  icon?: LucideIcon;
  tone?: keyof typeof TONE;
};

type TimelineProps = {
  items: TimelineItem[];
  className?: string;
};

/**
 * A vertical activity feed / event trail: a node (icon chip or dot) on a
 * connecting rail, with title, description and timestamp. Token-based; semantic
 * tones carry meaning (success/warning/…).
 */
function Timeline({ items, className }: TimelineProps) {
  return (
    <View className={cn('w-full', className)}>
      {items.map((item, i) => {
        const tone = TONE[item.tone ?? 'muted'];
        const isLast = i === items.length - 1;
        return (
          <View key={i} className="flex-row gap-3">
            {/* Rail: node + connector */}
            <View className="items-center">
              <View className="size-8 items-center justify-center">
                {item.icon ? (
                  <View className={cn('size-8 items-center justify-center rounded-full', tone.chip)}>
                    <Icon as={item.icon} size={16} className={tone.icon} />
                  </View>
                ) : (
                  <View className={cn('size-2.5 rounded-full', tone.dot)} />
                )}
              </View>
              {!isLast ? <View className="bg-border my-1 w-0.5 flex-1 rounded-full" /> : null}
            </View>

            {/* Content */}
            <View className={cn('flex-1 gap-0.5', !isLast && 'pb-5')}>
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-[15px] font-medium text-foreground">{item.title}</Text>
                {item.time ? (
                  <Text variant="muted" className="text-xs">
                    {item.time}
                  </Text>
                ) : null}
              </View>
              {item.description ? (
                <Text variant="muted" className="text-sm">
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export { Timeline };
export type { TimelineItem, TimelineProps };
