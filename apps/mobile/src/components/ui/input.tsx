import { Icon } from '@/components/ui/icon';
import { cn } from '@/shared/lib/utils';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

type InputProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & {
    /** Optional leading icon rendered inside the field. */
    icon?: LucideIcon;
    /** Red error styling (border) — pair with a helper message. */
    invalid?: boolean;
  };

/**
 * A soft, filled input surface (not a bare outline): rounded, elevated `bg-card`
 * field with an optional leading icon, a primary focus ring, and an error state.
 * `className` styles the field container; text-editing props pass to the input.
 */
function Input({ className, icon, invalid, style, onFocus, onBlur, secureTextEntry, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const disabled = props.editable === false;
  const isPassword = !!secureTextEntry;
  return (
    <View
      className={cn(
        'h-12 flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-sm shadow-black/5',
        focused && 'border-primary',
        invalid && 'border-destructive',
        disabled && 'opacity-50',
        className
      )}>
      {icon ? (
        <Icon
          as={icon}
          size={18}
          className={cn('text-muted-foreground', focused && 'text-primary', invalid && 'text-destructive')}
        />
      ) : null}
      <TextInput
        style={[{ fontFamily: 'Inter_400Regular' }, style]}
        className={cn(
          'h-full flex-1 text-base text-foreground',
          Platform.select({
            native: 'placeholder:text-muted-foreground/50',
            web: 'outline-none placeholder:text-muted-foreground',
          })
        )}
        secureTextEntry={isPassword && !revealed}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {isPassword ? (
        <Pressable
          onPress={() => setRevealed((r) => !r)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          className="active:opacity-60">
          <Icon as={revealed ? EyeOff : Eye} size={18} className="text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}

export { Input };
