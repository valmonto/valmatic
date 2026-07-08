import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

type DataListRow = { label: string; value: React.ReactNode };

type DataListProps = {
  rows: DataListRow[];
  /** Hairline dividers between rows. */
  divided?: boolean;
  className?: string;
};

/**
 * A key–value list (label left, value right) for a single record's fields — the
 * mobile take on a detail/description table. Compose inside a Card or the
 * DataTable's per-record card. String/number values render as right-aligned
 * text; pass any node (e.g. a Badge) for custom cells.
 */
function DataList({ rows, divided = true, className }: DataListProps) {
  return (
    <View className={cn(className)}>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {divided && i > 0 ? <View className="bg-border h-px" /> : null}
          <View className="flex-row items-center justify-between gap-4 py-2.5">
            <Text variant="muted" className="text-sm">
              {row.label}
            </Text>
            <View className="flex-1 items-end">
              {typeof row.value === 'string' || typeof row.value === 'number' ? (
                <Text className="text-right text-sm text-foreground">{row.value}</Text>
              ) : (
                row.value
              )}
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export { DataList };
export type { DataListProps, DataListRow };
