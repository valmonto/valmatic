import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView } from 'react-native';

type FilterOption = { label: string; value: string; icon?: LucideIcon; count?: number };

type FilterChipsProps = { options: FilterOption[]; className?: string } & (
  | { multiple?: false; value: string; onChange: (value: string) => void }
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
);

/**
 * A horizontally-scrollable row of toggle chips for filtering a list — the mobile
 * filtering pattern (All / Active / Archived…, or multi-select tags). Selected
 * chips fill with `bg-primary`; token-based throughout.
 */
function FilterChips(props: FilterChipsProps) {
  const { options, className } = props;

  const isSelected = (value: string) =>
    props.multiple ? props.value.includes(value) : props.value === value;

  const toggle = (value: string) => {
    if (props.multiple) {
      const set = new Set(props.value);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      props.onChange([...set]);
    } else {
      props.onChange(value);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-80',
              selected ? 'border-primary bg-primary' : 'border-border bg-card'
            )}>
            {option.icon ? (
              <Icon
                as={option.icon}
                size={14}
                className={selected ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
            ) : null}
            <Text
              className={cn(
                'text-sm font-medium',
                selected ? 'text-primary-foreground' : 'text-foreground'
              )}>
              {option.label}
            </Text>
            {option.count != null ? (
              <Text
                className={cn(
                  'text-xs tabular-nums',
                  selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}>
                {option.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export { FilterChips };
export type { FilterChipsProps, FilterOption };
