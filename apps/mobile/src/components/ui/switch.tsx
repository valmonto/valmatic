import { cn } from '@/shared/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform, type ViewStyle } from 'react-native';

function Switch({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  const checked = props.checked;
  return (
    <SwitchPrimitives.Root
      className={cn(
        // Larger, dimensional track (h-7 w-[52px]); px-0.5 insets the thumb.
        'h-7 w-[52px] shrink-0 flex-row items-center rounded-full',
        checked ? 'px-2' : 'px-0.5',
        Platform.select({
          web: 'peer inline-flex border border-transparent outline-none transition-all focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed',
        }),
        checked ? 'bg-primary' : 'bg-input dark:bg-input',
        props.disabled && 'opacity-50',
        className,
      )}
      // Recessed track (inset shadow) — the subtle "glass" depth from the web.
      style={[
        {
          boxShadow: checked
            ? 'inset 0px 1px 2px rgba(0,0,0,0.10)'
            : 'inset 0px 1px 3px rgba(0,0,0,0.16)',
        },
        style as ViewStyle | undefined,
      ]}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'size-6 rounded-full bg-background transition-transform',
          Platform.select({ web: 'pointer-events-none block ring-0' }),
          checked ? 'dark:bg-white translate-x-[22px]' : 'dark:bg-foreground translate-x-0',
        )}
        // Floating thumb with a soft drop shadow + hairline ring for definition.
        style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.28), 0px 0px 0px 0.5px rgba(0,0,0,0.05)' }}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
