import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

type SwipeActionTone = 'primary' | 'destructive' | 'success' | 'neutral';

type SwipeAction = {
  label?: string;
  icon?: LucideIcon;
  tone?: SwipeActionTone;
  onPress: () => void;
};

// Full-bleed colored action panels. Token-based bg (primary/destructive swap
// with the theme); green carries "archive/confirm" meaning.
const TONE = {
  primary: { bg: 'bg-primary', fg: 'text-primary-foreground' },
  destructive: { bg: 'bg-destructive', fg: 'text-white' },
  success: { bg: 'bg-green-600', fg: 'text-white' },
  neutral: { bg: 'bg-secondary', fg: 'text-secondary-foreground' },
} as const;

type SwipeableRowProps = {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
};

/**
 * Wraps a row (e.g. a `ListItem`) with swipe-to-reveal actions — the native
 * mobile pattern for per-entry actions (swipe left/right for Delete, Archive,
 * Star…). Token-styled action panels; the row stays opaque while sliding.
 */
function SwipeableRow({ children, leftActions, rightActions }: SwipeableRowProps) {
  const ref = React.useRef<Swipeable>(null);

  const renderActions = (actions?: SwipeAction[]) =>
    actions && actions.length
      ? () => (
          <View className="flex-row">
            {actions.map((action, i) => {
              const tone = TONE[action.tone ?? 'neutral'];
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    ref.current?.close();
                    action.onPress();
                  }}
                  className={cn('items-center justify-center gap-1 px-4', tone.bg)}
                  style={{ minWidth: 76 }}
                >
                  {action.icon ? <Icon as={action.icon} size={20} className={tone.fg} /> : null}
                  {action.label ? (
                    <Text className={cn('text-xs font-medium', tone.fg)}>{action.label}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )
      : undefined;

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootFriction={8}
      renderLeftActions={renderActions(leftActions)}
      renderRightActions={renderActions(rightActions)}
    >
      {/* Opaque so the row cleanly covers the action panels while sliding. */}
      <View className="bg-card">{children}</View>
    </Swipeable>
  );
}

export { SwipeableRow };
export type { SwipeAction, SwipeableRowProps };
