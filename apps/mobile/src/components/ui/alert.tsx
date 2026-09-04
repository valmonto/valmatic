import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

/**
 * Cohesive semantic styling per variant: the card tint, icon, title and body
 * text all pull from the same colour so each alert reads as one unit.
 * `destructive` stays on the themeable token; the status hues (info/success/
 * warning) follow the same convention the app's priority pills already use.
 */
const alertVariants: Record<
  AlertVariant,
  { container: string; icon: string; title: string; description: string }
> = {
  default: {
    container: 'border-border bg-card',
    icon: 'text-foreground',
    title: 'text-foreground',
    description: 'text-muted-foreground',
  },
  info: {
    container: 'border-blue-500/25 bg-blue-500/10 dark:border-blue-400/35 dark:bg-blue-400/15',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-700 dark:text-blue-300',
    description: 'text-blue-700/80 dark:text-blue-200/80',
  },
  success: {
    container:
      'border-emerald-500/25 bg-emerald-500/10 dark:border-emerald-400/35 dark:bg-emerald-400/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-700 dark:text-emerald-300',
    description: 'text-emerald-700/80 dark:text-emerald-200/80',
  },
  warning: {
    container: 'border-amber-500/25 bg-amber-500/10 dark:border-amber-400/35 dark:bg-amber-400/15',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-700 dark:text-amber-300',
    description: 'text-amber-700/80 dark:text-amber-200/80',
  },
  destructive: {
    container: 'border-destructive/30 bg-destructive/10 dark:border-red-400/35 dark:bg-red-400/15',
    icon: 'text-destructive dark:text-red-400',
    title: 'text-destructive dark:text-red-300',
    description: 'text-destructive/90 dark:text-red-200/80',
  },
};

const AlertVariantContext = React.createContext<AlertVariant>('default');

function Alert({
  className,
  variant = 'default',
  children,
  icon,
  iconClassName,
  ...props
}: React.ComponentProps<typeof View> &
  React.RefAttributes<View> & {
    icon: LucideIcon;
    variant?: AlertVariant;
    iconClassName?: string;
  }) {
  const meta = alertVariants[variant];
  return (
    <AlertVariantContext.Provider value={variant}>
      <View
        role="alert"
        className={cn(
          'w-full flex-row items-start gap-3 rounded-2xl border p-4 shadow-sm shadow-black/5',
          meta.container,
          className,
        )}
        {...props}
      >
        <Icon as={icon} size={18} className={cn('mt-px shrink-0', meta.icon, iconClassName)} />
        <View className="flex-1">{children}</View>
      </View>
    </AlertVariantContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  const variant = React.useContext(AlertVariantContext);
  return (
    <Text
      className={cn(
        'font-medium leading-none tracking-tight',
        alertVariants[variant].title,
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  const variant = React.useContext(AlertVariantContext);
  return (
    <Text
      className={cn('mt-1 text-sm leading-relaxed', alertVariants[variant].description, className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
