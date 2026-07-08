import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { EllipsisVertical, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';

type RowMenuAction = {
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  /** Insert a separator above this item. */
  separated?: boolean;
  onPress: () => void;
};

type RowMenuProps = {
  actions: RowMenuAction[];
  /** Trigger glyph — defaults to the overflow ⋮ (swap to `Settings` for a cog, etc.). */
  icon?: LucideIcon;
  className?: string;
};

/**
 * A trailing overflow/"cog" menu for a row — the discoverable counterpart to
 * swipe actions. Renders a small icon button that opens a themed dropdown of
 * actions. Drop into `ListItem`'s `menu` slot.
 */
function RowMenu({ actions, icon = EllipsisVertical, className }: RowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="More actions"
          className={cn('rounded-full p-1 active:opacity-60', className)}>
          <Icon as={icon} size={18} className="text-muted-foreground" />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {actions.map((action, i) => (
          <React.Fragment key={i}>
            {action.separated ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              onPress={action.onPress}
              variant={action.destructive ? 'destructive' : 'default'}>
              {action.icon ? (
                <Icon
                  as={action.icon}
                  size={16}
                  className={action.destructive ? 'text-destructive' : 'text-muted-foreground'}
                />
              ) : null}
              <Text>{action.label}</Text>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RowMenu };
export type { RowMenuAction, RowMenuProps };
