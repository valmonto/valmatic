import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Premium "physical key": a vertical sheen over the solid fill (light top →
        // faint shade at the bottom), a layered shadow, inner top highlight, and a
        // crisp pressed state. The gradient is a background-image laid over bg-*, so
        // it adapts to whatever the fill color is.
        default:
          'bg-primary text-primary-foreground bg-[linear-gradient(180deg,rgba(255,255,255,0.17),rgba(255,255,255,0)_46%,rgba(0,0,0,0.10))] shadow-[0_1px_2px_rgba(16,18,28,0.22),0_2px_6px_-2px_rgba(16,18,28,0.16),inset_0_1px_0_rgba(255,255,255,0.20)] hover:brightness-[1.07] active:translate-y-px active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.20)] active:brightness-100',
        destructive:
          'bg-destructive text-white bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_46%,rgba(0,0,0,0.10))] shadow-[0_1px_2px_rgba(16,18,28,0.22),0_2px_6px_-2px_rgba(16,18,28,0.16),inset_0_1px_0_rgba(255,255,255,0.16)] hover:brightness-[1.07] focus-visible:ring-destructive/30 active:translate-y-px active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)] active:brightness-100',
        outline:
          'border border-input bg-background shadow-[0_1px_2px_rgba(16,18,28,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-accent hover:text-accent-foreground hover:border-foreground/20 active:translate-y-px active:shadow-none dark:bg-input/30 dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0)_60%)] shadow-[0_1px_2px_rgba(16,18,28,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-inset ring-black/[0.04] hover:brightness-[0.98] active:translate-y-px dark:bg-none dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] dark:ring-white/[0.06] dark:hover:bg-secondary/80 dark:hover:brightness-100',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline active:translate-y-0',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
