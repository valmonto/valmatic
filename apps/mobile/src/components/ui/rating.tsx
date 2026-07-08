import { cn } from '@/shared/lib/utils';
import { useThemeColors } from '@/shared/lib/theme-colors';
import { Star } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type RatingProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  readOnly?: boolean;
  className?: string;
};

/**
 * A star rating — interactive (tap to set) or read-only. Filled stars use the
 * primary accent; empty stars a muted outline.
 */
function Rating({ value, onChange, max = 5, size = 24, readOnly, className }: RatingProps) {
  const colors = useThemeColors();
  const interactive = !!onChange && !readOnly;

  return (
    <View className={cn('flex-row gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        const star = (
          <Star
            size={size}
            color={filled ? colors.primary : colors.starEmpty}
            fill={filled ? colors.primary : 'transparent'}
            strokeWidth={2}
          />
        );
        return interactive ? (
          <Pressable
            key={i}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${i + 1}`}
            onPress={() => onChange!(i + 1)}
            className="active:opacity-70">
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}

export { Rating };
export type { RatingProps };
