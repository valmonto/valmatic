import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** Leading icon-chip tones (semantic colors carry meaning; not accent-swap sensitive). */
const TONES = {
  primary: { chip: 'bg-primary/10', icon: 'text-primary' },
  muted: { chip: 'bg-muted', icon: 'text-muted-foreground' },
  success: { chip: 'bg-green-500/10', icon: 'text-green-600 dark:text-green-500' },
  destructive: { chip: 'bg-destructive/10', icon: 'text-destructive' },
} as const;

type ListProps = {
  children: React.ReactNode;
  className?: string;
};

/** A grouped card that renders its `ListItem` children with full-width dividers. */
function List({ children, className }: ListProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View className={cn('border-border bg-card overflow-hidden rounded-2xl border', className)}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View className="bg-border h-px" /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

type ListItemProps = {
  title: string;
  description?: string;
  /** Leading icon rendered in a tonal chip. */
  icon?: LucideIcon;
  iconTone?: keyof typeof TONES;
  /** Custom leading node (e.g. an Avatar) — overrides `icon`. */
  leading?: React.ReactNode;
  /** Trailing value text (e.g. an amount or count) — bold, right-aligned. */
  value?: string;
  /** Small muted text under `value` (e.g. a status like "Completed"). */
  caption?: string;
  /** Extra classes for `value` (e.g. color a +/- amount). */
  valueClassName?: string;
  /** Custom trailing node (e.g. a Switch or Badge) — overrides value/caption. */
  trailing?: React.ReactNode;
  /** Far-right affordance (e.g. a RowMenu). Replaces the chevron when set. */
  menu?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  className?: string;
};

/** A single row: leading icon/avatar · title + description · trailing value/chevron. */
function ListItem({
  title,
  description,
  icon,
  iconTone = 'primary',
  leading,
  value,
  caption,
  valueClassName,
  trailing,
  menu,
  showChevron,
  onPress,
  destructive,
  className,
}: ListItemProps) {
  const tone = destructive ? TONES.destructive : TONES[iconTone];
  const inner = (
    <>
      {leading ??
        (icon ? (
          <View className={cn('size-9 items-center justify-center rounded-full', tone.chip)}>
            <Icon as={icon} size={18} className={tone.icon} />
          </View>
        ) : null)}
      <View className="flex-1 gap-0.5">
        <Text
          numberOfLines={1}
          className={cn('text-[15px]', destructive ? 'text-destructive' : 'text-foreground')}
        >
          {title}
        </Text>
        {description ? (
          <Text variant="muted" numberOfLines={1} className="text-[13px]">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (value || caption ? (
          <View className="items-end gap-0.5">
            {value ? (
              <Text className={cn('text-sm font-medium text-foreground', valueClassName)}>
                {value}
              </Text>
            ) : null}
            {caption ? (
              <Text variant="muted" className="text-xs">
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null)}
      {menu ??
        (showChevron ? (
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        ) : null)}
    </>
  );

  const rowClass = cn('flex-row items-center gap-3 px-4 py-3', className);
  return onPress ? (
    <Pressable onPress={onPress} className={cn(rowClass, 'active:bg-muted')}>
      {inner}
    </Pressable>
  ) : (
    <View className={rowClass}>{inner}</View>
  );
}

export { List, ListItem };
export type { ListItemProps, ListProps };
