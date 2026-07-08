import { DataList } from '@/components/ui/data-list';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Column<T> = {
  key: keyof T;
  label: string;
  /** Custom cell (e.g. a Badge). Falls back to `String(row[key])`. */
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  /** Column shown as the card's bold title (its label is omitted from the rows). */
  titleKey?: keyof T;
  onRowPress?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string;
  className?: string;
};

/**
 * The responsive "table → cards" transform: each record renders as a card, with
 * its columns as label→value rows (via DataList). The phone-friendly alternative
 * to a column grid — any field count, any width, scannable and tappable.
 */
function DataTable<T>({
  data,
  columns,
  titleKey,
  onRowPress,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  return (
    <View className={cn('w-full gap-3', className)}>
      {data.map((row, index) => {
        const key = keyExtractor ? keyExtractor(row, index) : String(index);
        const title = titleKey != null ? String(row[titleKey]) : undefined;
        const rows = columns
          .filter((c) => c.key !== titleKey)
          .map((c) => ({
            label: c.label,
            value: c.render ? c.render(row) : String(row[c.key]),
          }));

        const card = (
          <View className="border-border bg-card gap-1 rounded-2xl border p-4">
            {title ? (
              <Text className="mb-1 text-[15px] font-semibold text-foreground">{title}</Text>
            ) : null}
            <DataList rows={rows} />
          </View>
        );

        return onRowPress ? (
          <Pressable key={key} onPress={() => onRowPress(row)} className="active:opacity-90">
            {card}
          </Pressable>
        ) : (
          <View key={key}>{card}</View>
        );
      })}
    </View>
  );
}

export { DataTable };
export type { Column, DataTableProps };
