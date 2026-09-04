import { Icon } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as TogglePrimitive from '@rn-primitives/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform } from 'react-native';

const toggleVariants = cva(
  cn(
    'active:bg-muted group flex flex-row items-center justify-center gap-2 rounded-full border border-transparent',
    Platform.select({
      web: 'hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex cursor-default whitespace-nowrap outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none',
    }),
  ),
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: cn(
          'border-border active:bg-accent bg-card shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent',
          }),
        ),
      },
      size: {
        default: 'h-11 min-w-11 px-3',
        sm: 'h-9 min-w-9 px-2.5',
        lg: 'h-12 min-w-12 px-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TextClassContext.Provider
      value={cn(
        'text-sm font-medium',
        props.pressed ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      <TogglePrimitive.Root
        className={cn(
          toggleVariants({ variant, size }),
          props.disabled && 'opacity-50',
          props.pressed && 'bg-primary/12 border-primary/20',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function ToggleIcon({ className, ...props }: React.ComponentProps<typeof Icon>) {
  const textClass = React.useContext(TextClassContext);
  return <Icon className={cn('size-4 shrink-0', textClass, className)} {...props} />;
}

export { Toggle, ToggleIcon, toggleVariants };
