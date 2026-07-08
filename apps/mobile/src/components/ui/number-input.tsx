import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { Minus, Plus } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

/**
 * A −/+ stepper for a bounded numeric value (quantity, count). Pill-shaped,
 * token-styled; buttons disable at the bounds.
 */
function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className,
}: NumberInputProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View
      className={cn('border-border bg-card flex-row items-center self-start rounded-full border', className)}>
      <Pressable
        onPress={() => set(value - step)}
        disabled={atMin}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        className={cn('size-11 items-center justify-center rounded-l-full active:bg-muted', atMin && 'opacity-40')}>
        <Icon as={Minus} size={18} className="text-foreground" />
      </Pressable>
      <Text className="w-12 text-center text-base font-medium tabular-nums text-foreground">{value}</Text>
      <Pressable
        onPress={() => set(value + step)}
        disabled={atMax}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        className={cn('size-11 items-center justify-center rounded-r-full active:bg-muted', atMax && 'opacity-40')}>
        <Icon as={Plus} size={18} className="text-foreground" />
      </Pressable>
    </View>
  );
}

export { NumberInput };
export type { NumberInputProps };
