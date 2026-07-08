import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action (e.g. a Button). */
  action?: React.ReactNode;
  className?: string;
};

/**
 * The no-data placeholder: a centered icon chip, title, description, and an
 * optional action. Use inside a list/screen when there's nothing to render.
 */
function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center gap-3 px-6 py-10', className)}>
      {icon ? (
        <View className="bg-muted size-14 items-center justify-center rounded-full">
          <Icon as={icon} size={26} className="text-muted-foreground" />
        </View>
      ) : null}
      <View className="items-center gap-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {description ? (
          <Text variant="muted" className="max-w-xs text-center text-sm">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="pt-1">{action}</View> : null}
    </View>
  );
}

export { EmptyState };
export type { EmptyStateProps };
