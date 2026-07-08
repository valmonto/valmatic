import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { Platform, TextInput, View } from 'react-native';

type TextInputFocusHandler = NonNullable<React.ComponentProps<typeof TextInput>['onFocus']>;

type TextareaProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & {
    /** Show a live character counter in the footer. Auto-enabled when `maxLength` is set. */
    showCount?: boolean;
    /** Render an invalid (destructive) border. */
    invalid?: boolean;
    /** Class applied to the outer container (border, radius, background). */
    containerClassName?: string;
  };

function Textarea({
  className,
  containerClassName,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
  placeholderClassName,
  style,
  onFocus,
  onBlur,
  onChangeText,
  maxLength,
  showCount,
  invalid,
  value,
  defaultValue,
  editable,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = React.useState(false);
  const [count, setCount] = React.useState((value ?? defaultValue ?? '').length);

  const handleFocus: TextInputFocusHandler = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur: TextInputFocusHandler = (e) => {
    setFocused(false);
    onBlur?.(e);
  };
  const handleChangeText = (text: string) => {
    setCount(text.length);
    onChangeText?.(text);
  };

  const currentCount = value != null ? value.length : count;
  const withCounter = showCount || maxLength != null;
  const nearLimit = maxLength != null && currentCount >= maxLength;

  return (
    <View
      className={cn(
        'border-border bg-card w-full overflow-hidden rounded-2xl border shadow-sm shadow-black/5',
        focused && 'border-foreground/40',
        invalid && 'border-destructive',
        editable === false && 'opacity-50',
        containerClassName
      )}>
      <TextInput
        style={[{ fontFamily: 'Inter_400Regular' }, style]}
        className={cn(
          'text-foreground min-h-24 w-full px-3.5 py-3 text-base',
          Platform.select({
            native: 'placeholder:text-muted-foreground',
            web: 'placeholder:text-muted-foreground field-sizing-content resize-y outline-none md:text-sm',
          }),
          className
        )}
        placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        maxLength={maxLength}
        editable={editable}
        value={value}
        defaultValue={defaultValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        {...props}
      />
      {withCounter ? (
        <View className="flex-row justify-end px-3.5 pb-2.5 pt-0">
          <Text
            className={cn(
              'text-muted-foreground text-xs tabular-nums',
              nearLimit && 'text-destructive font-medium'
            )}>
            {currentCount}
            {maxLength != null ? ` / ${maxLength}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export { Textarea };
