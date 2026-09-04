import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as React from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type OTPInputProps = {
  /** Number of cells. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires once the code is fully entered. */
  onComplete?: (value: string) => void;
  /** Render dots instead of digits (PIN entry). */
  masked?: boolean;
  /** Cells per group (separated by a dash). Defaults to 3 for /3 lengths, else 2. */
  groupSize?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Segmented one-time-code / PIN input. A single hidden `TextInput` (numeric,
 * SMS/one-time-code autofill) captures entry; the visible cells mirror it, with
 * a blinking caret on the active cell. Theme-token styled for light/dark.
 */
function OTPInput({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  masked,
  groupSize,
  invalid,
  autoFocus,
  disabled,
  className,
}: OTPInputProps) {
  const inputRef = React.useRef<TextInput>(null);
  const [internal, setInternal] = React.useState(defaultValue);
  const [focused, setFocused] = React.useState(false);
  const code = value ?? internal;

  const setCode = (next: string) => {
    const digits = next.replace(/[^0-9]/g, '').slice(0, length);
    if (value == null) setInternal(digits);
    onChange?.(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  // Ungrouped by default (matches the clean Mobbin OTP screens); opt into a
  // dash-separated 3·3 / 2·2 layout by passing `groupSize`.
  const gs = groupSize ?? length;
  const groups: number[][] = [];
  for (let i = 0; i < length; i += gs) {
    groups.push(Array.from({ length: Math.min(gs, length - i) }, (_, k) => i + k));
  }

  const renderCell = (i: number) => {
    const char = code[i];
    const filled = char != null;
    const isActive = focused && (i === code.length || (code.length === length && i === length - 1));
    return (
      <View
        key={i}
        className={cn(
          // Soft filled chip carries the shape; the border is just an accent
          // (a lone thin border reads cheap, especially in dark).
          'aspect-square flex-1 items-center justify-center rounded-2xl border border-border bg-muted',
          isActive && 'border-primary',
          invalid && 'border-destructive',
          disabled && 'opacity-50',
        )}
      >
        {filled ? (
          <Text className="text-2xl font-semibold text-foreground">{masked ? '•' : char}</Text>
        ) : isActive ? (
          <Caret />
        ) : null}
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      className={cn('flex-row items-center justify-center gap-2.5', className)}
    >
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 ? <View className="mx-1 h-0.5 w-3 rounded-full bg-muted-foreground/40" /> : null}
          <View className="flex-1 flex-row gap-2.5">{group.map(renderCell)}</View>
        </React.Fragment>
      ))}

      {/* Invisible capture field overlaying the cells. */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={setCode}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.select({ android: 'sms-otp', default: 'one-time-code' })}
        autoFocus={autoFocus}
        editable={!disabled}
        caretHidden
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
      />
    </Pressable>
  );
}

/** Blinking text caret shown in the active empty cell. */
function Caret() {
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="h-6 w-0.5 rounded-full bg-primary" />;
}

export { OTPInput };
export type { OTPInputProps };
