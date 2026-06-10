'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useTheme } from '@/shared/components/theme-provider';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      offset={16}
      gap={10}
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-emerald-500" />,
        info: <InfoIcon className="size-[18px] text-sky-500" />,
        warning: <TriangleAlertIcon className="size-[18px] text-amber-500" />,
        error: <OctagonXIcon className="size-[18px] text-red-500" />,
        loading: <Loader2Icon className="size-[18px] animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          // Floating card: hairline ring + layered shadow + backdrop blur, matching ui/card.
          toast:
            'group/toast !gap-3 !rounded-xl !border-border/60 !bg-popover/85 !p-4 !backdrop-blur-xl !shadow-[0_1px_2px_rgba(16,18,28,0.10),0_16px_40px_-16px_rgba(16,18,28,0.35)] ring-1 ring-black/[0.03] dark:ring-white/[0.05]',
          title: '!text-[13px] !font-semibold !tracking-tight',
          description: '!text-[13px] !text-muted-foreground',
          icon: '!mt-0.5 !mr-0.5',
          // Action / cancel pick up the app button language.
          actionButton:
            '!h-7 !rounded-md !bg-primary !px-2.5 !text-xs !font-medium !text-primary-foreground !shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.18)] hover:!brightness-110',
          cancelButton:
            '!h-7 !rounded-md !bg-transparent !px-2.5 !text-xs !font-medium !text-muted-foreground hover:!text-foreground',
          closeButton:
            '!rounded-md !border-border/60 !bg-popover !text-muted-foreground hover:!text-foreground hover:!bg-accent',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'calc(var(--radius) + 4px)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
